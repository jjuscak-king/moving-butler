-- Moving Butler Week 3: Admin packs, key contacts, move-day issue log.
-- Architecture comments stay L1–L3 here and in README only — not in product chrome.

alter table public.moves
  add column if not exists key_contacts text;

comment on column public.moves.key_contacts is
  'Optional super / management / crew numbers for the Move-day runbook.';
comment on column public.moves.building_notes is
  'Building and management access notes. Surfaced on Admin and Move day.';

alter table public.tasks
  add column if not exists pack_key text;

comment on column public.tasks.pack_key is
  'Optional Admin pack grouping: building, change_of_address, utilities, internet, insurance.';

create index if not exists tasks_pack_key_idx
  on public.tasks (move_id, pack_key)
  where pack_key is not null;

-- ---------------------------------------------------------------------------
-- Move-day SOS / issue log (append-only for members)
-- ---------------------------------------------------------------------------

create table if not exists public.move_issues (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves (id) on delete cascade,
  kind text not null,
  details text,
  next_steps text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint move_issues_kind_not_blank check (char_length(btrim(kind)) > 0),
  constraint move_issues_next_steps_not_blank check (char_length(btrim(next_steps)) > 0)
);

create index if not exists move_issues_move_id_idx
  on public.move_issues (move_id, created_at desc);

alter table public.move_issues enable row level security;

drop policy if exists "move_issues_select_member" on public.move_issues;
create policy "move_issues_select_member"
  on public.move_issues for select
  to authenticated
  using (public.is_move_member(move_id));

drop policy if exists "move_issues_insert_member" on public.move_issues;
create policy "move_issues_insert_member"
  on public.move_issues for insert
  to authenticated
  with check (public.is_move_member(move_id) and created_by = auth.uid());

grant select, insert on public.move_issues to authenticated;

-- Owner can remove a co-mover (not the owner row).
drop policy if exists "move_members_delete_owner" on public.move_members;
create policy "move_members_delete_owner"
  on public.move_members for delete
  to authenticated
  using (public.is_move_owner(move_id) and role <> 'owner');

grant delete on public.move_members to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: Admin packs (building, COA, utilities, internet, insurance)
-- ---------------------------------------------------------------------------

create or replace function public.seed_move_workstreams()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.move_stages (move_id, stage_key, sort_order, status) values
    (new.id, 'decide', 1, 'not_started'),
    (new.id, 'plan', 2, 'not_started'),
    (new.id, 'vendors', 3, 'not_started'),
    (new.id, 'admin', 4, 'not_started'),
    (new.id, 'move_day', 5, 'not_started'),
    (new.id, 'settle', 6, 'not_started');

  insert into public.tasks (move_id, stage_key, title, notes, sort_order, is_optional, pack_key) values
    -- Decide
    (new.id, 'decide', 'Confirm move date window', 'Lock the start/end window on this move profile so later stages can plan around it.', 1, false, null),
    (new.id, 'decide', 'Confirm DIY vs full-service', 'DIY, hybrid, or full-service changes packing, truck, and crew work later.', 2, false, null),
    (new.id, 'decide', 'Rough inventory / size check', 'Studio vs 1BR vs 2BR+ changes elevator time, truck size, and packing load.', 3, false, null),
    -- Plan
    (new.id, 'plan', 'Create room pack order', 'Decide which rooms pack first so NYC loading windows stay short.', 1, false, null),
    (new.id, 'plan', 'Order packing supplies', 'Boxes, tape, mattress bags, and wardrobe boxes before the weekend crunch.', 2, false, null),
    (new.id, 'plan', 'Share plan with household', 'Get everyone aligned on dates, keep/sell/donate, and access constraints.', 3, false, null),
    -- Vendors (manual “I booked this” later — not a marketplace)
    (new.id, 'vendors', 'Book movers', 'Hold a crew for the window. Capture the booking yourself in a later week.', 1, false, null),
    (new.id, 'vendors', 'Book packing help if needed', 'Useful for 2BR+ or tight NYC loading windows.', 2, true, null),
    (new.id, 'vendors', 'Reserve truck/parking if DIY', 'Street parking and loading zones are the DIY bottleneck in NYC.', 3, true, null),
    -- Admin packs. Always include COI + elevator even if flags are false.
    (new.id, 'admin', 'Request COI if needed', 'Many Manhattan and Brooklyn buildings require a Certificate of Insurance from movers. Keep visible even if COI is currently unmarked.', 1, true, 'building'),
    (new.id, 'admin', 'Book elevator / loading dock', 'Reserve service elevator and dock time with management. Keep visible even if access is currently walk-up.', 2, true, 'building'),
    (new.id, 'admin', 'Read building move rules', 'Hours, padding requirements, COI minimums, and freight elevator rules from both buildings.', 3, false, 'building'),
    (new.id, 'admin', 'Loading dock reservation notes', 'Confirm freight/loading-dock hours, reservation, and whether the truck can stage at the dock vs the street.', 4, true, 'building'),
    (new.id, 'admin', 'Street parking notes', 'Hydrants, bus stops, alternate-side, and where a truck can legally stand.', 5, false, 'building'),
    (new.id, 'admin', 'Walk-up logistics', 'Flight count, long carries, and extra crew time if either side is a walk-up.', 6, true, 'building'),
    (new.id, 'admin', 'DOT parking permit if needed', 'Temporary no-parking signs can be requested for a moving truck.', 7, true, 'building'),
    (new.id, 'admin', 'Building super / management contact', 'Save super, management, and loading-dock numbers in key contacts so they show on the Move-day runbook.', 8, false, 'building'),
    (new.id, 'admin', 'Start change-of-address list', 'USPS, banks, subscriptions, payroll, and building packages.', 10, false, 'change_of_address'),
    (new.id, 'admin', 'USPS COA', 'File USPS change of address; NYC forwarding can lag around move week. Use the pack link to MoversGuide.', 11, false, 'change_of_address'),
    (new.id, 'admin', 'NYC.gov / 311 address', 'Update NYC.gov / 311 account address so parking tickets, bulk pickup, and city mail follow you.', 12, false, 'change_of_address'),
    (new.id, 'admin', 'Banks, payroll, and subscriptions', 'Banks, payroll, Amazon, packages, and anything that ships to the old door.', 13, false, 'change_of_address'),
    (new.id, 'admin', 'NY DMV / ID address', 'NY license, learner permit, or non-driver ID address. Optional if you are not changing ID yet.', 14, true, 'change_of_address'),
    (new.id, 'admin', 'Utilities shutoff/start list', 'Overlap service so you are not dark on night one.', 20, false, 'utilities'),
    (new.id, 'admin', 'Con Edison', 'Start/stop electric (and gas where Con Ed serves). Bring account + address window.', 21, false, 'utilities'),
    (new.id, 'admin', 'National Grid gas if applicable', 'Brooklyn, Queens, and Staten Island gas is often National Grid. Skip if Con Ed covers both.', 22, true, 'utilities'),
    (new.id, 'admin', 'NYC DEP water/sewer', 'Start/stop if you pay DEP directly. Many rentals bill water through management — confirm which.', 23, true, 'utilities'),
    (new.id, 'admin', 'Internet transfer', 'Spectrum, Fios, Optimum, or Starry — install slots book out in NYC.', 30, false, 'internet'),
    (new.id, 'admin', 'Confirm internet install window', 'Tech access, riser, and whether someone must be home. Do not assume same-day as the move.', 31, false, 'internet'),
    (new.id, 'admin', 'Renters insurance at destination', 'Bind coverage that starts on move-in. Buildings and lenders often ask for proof the first week.', 40, false, 'insurance'),
    (new.id, 'admin', 'Confirm mover valuation / insurance', 'Released value vs full-value protection. This is not a marketplace — capture what you already bought.', 41, false, 'insurance'),
    -- Move day
    (new.id, 'move_day', 'Confirm crew time', 'Reconfirm arrival window with whoever you booked. Buildings are unforgiving.', 1, false, null),
    (new.id, 'move_day', 'Prep building access notes', 'COI on file, elevator pad time, walk-up path, super phone, loading dock.', 2, false, null),
    (new.id, 'move_day', 'Protect floors / elevators notes', 'Pads, runner, and door-jamb protection so the building does not charge you.', 3, false, null),
    -- Settle
    (new.id, 'settle', 'Unpack priorities', 'Beds, kitchen, and work setup before decorative boxes.', 1, false, null),
    (new.id, 'settle', 'Confirm utilities live', 'Power, gas, water, internet. Chase anything that did not flip on day one.', 2, false, null),
    (new.id, 'settle', '7-day open-task sweep', 'Walk remaining todos, returns, and building deposits one week in.', 3, false, null);

  -- Soft dependency: COI admin work before Move-day critical tasks.
  -- Warning-only (depends_on); do not hard-lock status to blocked.
  update public.tasks t
  set depends_on_task_id = coi.id
  from public.tasks coi
  where coi.move_id = new.id
    and coi.title = 'Request COI if needed'
    and t.move_id = new.id
    and t.stage_key = 'move_day'
    and t.title in (
      'Confirm crew time',
      'Prep building access notes',
      'Protect floors / elevators notes'
    );

  return new;
end;
$$;

-- Existing Case Files: pack keys + Week 3 Admin titles. Do not overwrite user notes.
update public.tasks t
set pack_key = v.pack_key
from (
  values
    ('Request COI if needed', 'building'),
    ('Book elevator / loading dock', 'building'),
    ('Read building move rules', 'building'),
    ('Loading dock reservation notes', 'building'),
    ('Street parking notes', 'building'),
    ('Walk-up logistics', 'building'),
    ('DOT parking permit if needed', 'building'),
    ('Building super / management contact', 'building'),
    ('Start change-of-address list', 'change_of_address'),
    ('USPS COA', 'change_of_address'),
    ('NYC.gov / 311 address', 'change_of_address'),
    ('Banks, payroll, and subscriptions', 'change_of_address'),
    ('NY DMV / ID address', 'change_of_address'),
    ('Utilities shutoff/start list', 'utilities'),
    ('Con Edison', 'utilities'),
    ('National Grid gas if applicable', 'utilities'),
    ('NYC DEP water/sewer', 'utilities'),
    ('Internet transfer', 'internet'),
    ('Confirm internet install window', 'internet'),
    ('Renters insurance at destination', 'insurance'),
    ('Confirm mover valuation / insurance', 'insurance')
) as v(title, pack_key)
where t.stage_key = 'admin'
  and t.title = v.title
  and t.pack_key is distinct from v.pack_key;

insert into public.tasks (move_id, stage_key, title, notes, sort_order, is_optional, pack_key)
select m.id, 'admin', v.title, v.notes, v.sort_order, v.is_optional, v.pack_key
from public.moves m
cross join (
  values
    ('NYC.gov / 311 address', 'Update NYC.gov / 311 account address so parking tickets, bulk pickup, and city mail follow you.', 12, false, 'change_of_address'),
    ('Banks, payroll, and subscriptions', 'Banks, payroll, Amazon, packages, and anything that ships to the old door.', 13, false, 'change_of_address'),
    ('NY DMV / ID address', 'NY license, learner permit, or non-driver ID address. Optional if you are not changing ID yet.', 14, true, 'change_of_address'),
    ('National Grid gas if applicable', 'Brooklyn, Queens, and Staten Island gas is often National Grid. Skip if Con Ed covers both.', 22, true, 'utilities'),
    ('NYC DEP water/sewer', 'Start/stop if you pay DEP directly. Many rentals bill water through management — confirm which.', 23, true, 'utilities'),
    ('Confirm internet install window', 'Tech access, riser, and whether someone must be home. Do not assume same-day as the move.', 31, false, 'internet'),
    ('Renters insurance at destination', 'Bind coverage that starts on move-in. Buildings and lenders often ask for proof the first week.', 40, false, 'insurance'),
    ('Confirm mover valuation / insurance', 'Released value vs full-value protection. This is not a marketplace — capture what you already bought.', 41, false, 'insurance')
) as v(title, notes, sort_order, is_optional, pack_key)
where not exists (
  select 1
  from public.tasks t
  where t.move_id = m.id
    and t.title = v.title
);
