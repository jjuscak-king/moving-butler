-- Moving Butler Week 2: due dates, simple dependencies, membership/invites,
-- NYC constraint-pack seed extension. Architecture comments stay L1–L3 here
-- and in README only — not in product chrome.

alter table public.profiles
  add column if not exists reminders_enabled boolean not null default true;

-- ---------------------------------------------------------------------------
-- Task columns: due dates, one-level depends_on, claim, reminder bookkeeping
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists due_date date,
  add column if not exists depends_on_task_id uuid references public.tasks (id) on delete set null,
  add column if not exists claimed_by uuid references auth.users (id) on delete set null,
  add column if not exists reminder_sent_on date;

alter table public.tasks
  drop constraint if exists tasks_no_self_dependency;
alter table public.tasks
  add constraint tasks_no_self_dependency
  check (depends_on_task_id is distinct from id);

create index if not exists tasks_due_date_idx
  on public.tasks (due_date)
  where due_date is not null and status <> 'done';
create index if not exists tasks_depends_on_idx
  on public.tasks (depends_on_task_id)
  where depends_on_task_id is not null;
create index if not exists tasks_claimed_by_idx
  on public.tasks (claimed_by)
  where claimed_by is not null;

create or replace function public.tasks_same_move_dependency()
returns trigger
language plpgsql
as $$
begin
  if new.depends_on_task_id is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.tasks t
    where t.id = new.depends_on_task_id
      and t.move_id = new.move_id
  ) then
    raise exception 'Dependency must be another task on the same Relocation Case File';
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_same_move_dependency on public.tasks;
create trigger tasks_same_move_dependency
before insert or update of depends_on_task_id, move_id on public.tasks
for each row execute procedure public.tasks_same_move_dependency();

-- ---------------------------------------------------------------------------
-- Membership + invite links
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.move_member_role as enum ('owner', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.move_members (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.move_member_role not null default 'member',
  email text,
  created_at timestamptz not null default now(),
  unique (move_id, user_id)
);

create table if not exists public.move_invites (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  revoked_at timestamptz,
  accepted_at timestamptz
);

create index if not exists move_members_user_id_idx on public.move_members (user_id);
create index if not exists move_members_move_id_idx on public.move_members (move_id);
create index if not exists move_invites_move_id_idx on public.move_invites (move_id, created_at desc);
create index if not exists move_invites_token_idx on public.move_invites (token);

insert into public.move_members (move_id, user_id, role, email)
select m.id, m.user_id, 'owner', p.email
from public.moves m
left join public.profiles p on p.id = m.user_id
on conflict (move_id, user_id) do nothing;

create or replace function public.add_move_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.move_members (move_id, user_id, role, email)
  values (
    new.id,
    new.user_id,
    'owner',
    (select email from public.profiles where id = new.user_id)
  )
  on conflict (move_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_move_created_owner_member on public.moves;
create trigger on_move_created_owner_member
after insert on public.moves
for each row execute procedure public.add_move_owner_member();

create or replace function public.is_move_owner(p_move_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.moves m
    where m.id = p_move_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_move_member(p_move_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.moves m
    where m.id = p_move_id
      and m.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.move_members mm
    where mm.move_id = p_move_id
      and mm.user_id = auth.uid()
  );
$$;

create or replace function public.get_move_invite(p_token text)
returns table (
  move_id uuid,
  move_label text,
  expires_at timestamptz,
  revoked boolean,
  already_member boolean,
  is_owner boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  inv public.move_invites%rowtype;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into inv
  from public.move_invites
  where token = p_token;

  if not found then
    return;
  end if;

  return query
  select
    inv.move_id,
    m.label,
    inv.expires_at,
    (inv.revoked_at is not null),
    exists (
      select 1
      from public.move_members mm
      where mm.move_id = inv.move_id
        and mm.user_id = auth.uid()
    ),
    (m.user_id = auth.uid())
  from public.moves m
  where m.id = inv.move_id;
end;
$$;

create or replace function public.accept_move_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.move_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'You must be signed in to join a Case File';
  end if;

  select * into inv
  from public.move_invites
  where token = p_token;

  if not found then
    raise exception 'That invite link is not valid';
  end if;

  if inv.revoked_at is not null then
    raise exception 'That invite link has been revoked';
  end if;

  if inv.expires_at <= now() then
    raise exception 'That invite link has expired';
  end if;

  insert into public.move_members (move_id, user_id, role, email)
  values (
    inv.move_id,
    uid,
    'member',
    coalesce(
      (select email from public.profiles where id = uid),
      auth.jwt() ->> 'email'
    )
  )
  on conflict (move_id, user_id) do nothing;

  update public.move_invites
  set accepted_at = coalesce(accepted_at, now())
  where id = inv.id;

  return inv.move_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seed: NYC constraint pack + COI before Move-day critical tasks
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

  insert into public.tasks (move_id, stage_key, title, notes, sort_order, is_optional) values
    -- Decide
    (new.id, 'decide', 'Confirm move date window', 'Lock the start/end window on this move profile so later stages can plan around it.', 1, false),
    (new.id, 'decide', 'Confirm DIY vs full-service', 'DIY, hybrid, or full-service changes packing, truck, and crew work later.', 2, false),
    (new.id, 'decide', 'Rough inventory / size check', 'Studio vs 1BR vs 2BR+ changes elevator time, truck size, and packing load.', 3, false),
    -- Plan
    (new.id, 'plan', 'Create room pack order', 'Decide which rooms pack first so NYC loading windows stay short.', 1, false),
    (new.id, 'plan', 'Order packing supplies', 'Boxes, tape, mattress bags, and wardrobe boxes before the weekend crunch.', 2, false),
    (new.id, 'plan', 'Share plan with household', 'Get everyone aligned on dates, keep/sell/donate, and access constraints.', 3, false),
    -- Vendors (manual “I booked this” later — not a marketplace)
    (new.id, 'vendors', 'Book movers', 'Hold a crew for the window. Capture the booking yourself in a later week.', 1, false),
    (new.id, 'vendors', 'Book packing help if needed', 'Useful for 2BR+ or tight NYC loading windows.', 2, true),
    (new.id, 'vendors', 'Reserve truck/parking if DIY', 'Street parking and loading zones are the DIY bottleneck in NYC.', 3, true),
    -- Admin (NYC cluster). Always include COI + elevator even if flags are false.
    (new.id, 'admin', 'Request COI if needed', 'Many Manhattan and Brooklyn buildings require a Certificate of Insurance from movers. Keep visible even if COI is currently unmarked.', 1, true),
    (new.id, 'admin', 'Book elevator / loading dock', 'Reserve service elevator and dock time with management. Keep visible even if access is currently walk-up.', 2, true),
    (new.id, 'admin', 'Read building move rules', 'Hours, padding requirements, COI minimums, and freight elevator rules from both buildings.', 3, false),
    (new.id, 'admin', 'Street parking notes', 'Hydrants, bus stops, alternate-side, and where a truck can legally stand.', 4, false),
    (new.id, 'admin', 'Walk-up logistics', 'Flight count, long carries, and extra crew time if either side is a walk-up.', 5, true),
    (new.id, 'admin', 'Start change-of-address list', 'USPS, banks, subscriptions, payroll, and building packages.', 6, false),
    (new.id, 'admin', 'USPS COA', 'File USPS change of address; NYC forwarding can lag around move week.', 7, false),
    (new.id, 'admin', 'Utilities shutoff/start list', 'Overlap service so you are not dark on night one.', 8, false),
    (new.id, 'admin', 'Con Edison', 'Start/stop electric (and gas where Con Ed serves). Bring account + address window.', 9, false),
    (new.id, 'admin', 'Internet transfer', 'Spectrum, Fios, Optimum, or Starry — install slots book out in NYC.', 10, false),
    (new.id, 'admin', 'Building super / management contact', 'Save super, management, and loading-dock numbers for move morning.', 11, false),
    (new.id, 'admin', 'DOT parking permit if needed', 'Temporary no-parking signs can be requested for a moving truck.', 12, true),
    (new.id, 'admin', 'Loading dock reservation notes', 'Confirm freight/loading-dock hours, reservation, and whether the truck can stage at the dock vs the street.', 13, true),
    -- Move day
    (new.id, 'move_day', 'Confirm crew time', 'Reconfirm arrival window with whoever you booked. Buildings are unforgiving.', 1, false),
    (new.id, 'move_day', 'Prep building access notes', 'COI on file, elevator pad time, walk-up path, super phone, loading dock.', 2, false),
    (new.id, 'move_day', 'Protect floors / elevators notes', 'Pads, runner, and door-jamb protection so the building does not charge you.', 3, false),
    -- Settle
    (new.id, 'settle', 'Unpack priorities', 'Beds, kitchen, and work setup before decorative boxes.', 1, false),
    (new.id, 'settle', 'Confirm utilities live', 'Power, gas, water, internet. Chase anything that did not flip on day one.', 2, false),
    (new.id, 'settle', '7-day open-task sweep', 'Walk remaining todos, returns, and building deposits one week in.', 3, false);

  -- Soft dependency: COI admin work before Move-day critical tasks.
  update public.tasks t
  set
    depends_on_task_id = coi.id,
    status = 'blocked'
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

-- Existing Case Files: add the extra NYC loading-dock note + COI → Move-day deps.
insert into public.tasks (move_id, stage_key, title, notes, sort_order, is_optional)
select
  m.id,
  'admin',
  'Loading dock reservation notes',
  'Confirm freight/loading-dock hours, reservation, and whether the truck can stage at the dock vs the street.',
  13,
  true
from public.moves m
where not exists (
  select 1
  from public.tasks t
  where t.move_id = m.id
    and t.title = 'Loading dock reservation notes'
);

update public.tasks t
set
  depends_on_task_id = coi.id,
  status = case when t.status = 'done' then t.status else 'blocked' end
from public.tasks coi
where coi.move_id = t.move_id
  and coi.title = 'Request COI if needed'
  and t.stage_key = 'move_day'
  and t.title in (
    'Confirm crew time',
    'Prep building access notes',
    'Protect floors / elevators notes'
  )
  and t.depends_on_task_id is null;

-- ---------------------------------------------------------------------------
-- RLS: members of a move, not only the owner
-- Money / legal / irreversible (Case File edit/delete, task delete, invites)
-- stay owner-only.
-- ---------------------------------------------------------------------------

drop policy if exists "moves_select_own" on public.moves;
drop policy if exists "moves_select_member" on public.moves;
create policy "moves_select_member"
  on public.moves for select
  to authenticated
  using (public.is_move_member(id));

drop policy if exists "move_stages_select_own" on public.move_stages;
drop policy if exists "move_stages_select_member" on public.move_stages;
create policy "move_stages_select_member"
  on public.move_stages for select
  to authenticated
  using (public.is_move_member(move_id));

drop policy if exists "move_stages_insert_own" on public.move_stages;
create policy "move_stages_insert_own"
  on public.move_stages for insert
  to authenticated
  with check (public.is_move_owner(move_id));

drop policy if exists "move_stages_update_own" on public.move_stages;
drop policy if exists "move_stages_update_member" on public.move_stages;
create policy "move_stages_update_member"
  on public.move_stages for update
  to authenticated
  using (public.is_move_member(move_id))
  with check (public.is_move_member(move_id));

drop policy if exists "move_stages_delete_own" on public.move_stages;
create policy "move_stages_delete_own"
  on public.move_stages for delete
  to authenticated
  using (public.is_move_owner(move_id));

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_select_member" on public.tasks;
create policy "tasks_select_member"
  on public.tasks for select
  to authenticated
  using (public.is_move_member(move_id));

drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_insert_member" on public.tasks;
create policy "tasks_insert_member"
  on public.tasks for insert
  to authenticated
  with check (public.is_move_member(move_id));

drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_update_member" on public.tasks;
create policy "tasks_update_member"
  on public.tasks for update
  to authenticated
  using (public.is_move_member(move_id))
  with check (public.is_move_member(move_id));

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  to authenticated
  using (public.is_move_owner(move_id));

alter table public.move_members enable row level security;
alter table public.move_invites enable row level security;

drop policy if exists "move_members_select_member" on public.move_members;
create policy "move_members_select_member"
  on public.move_members for select
  to authenticated
  using (public.is_move_member(move_id));

drop policy if exists "move_invites_select_owner" on public.move_invites;
create policy "move_invites_select_owner"
  on public.move_invites for select
  to authenticated
  using (public.is_move_owner(move_id));

drop policy if exists "move_invites_insert_owner" on public.move_invites;
create policy "move_invites_insert_owner"
  on public.move_invites for insert
  to authenticated
  with check (public.is_move_owner(move_id) and created_by = auth.uid());

drop policy if exists "move_invites_update_owner" on public.move_invites;
create policy "move_invites_update_owner"
  on public.move_invites for update
  to authenticated
  using (public.is_move_owner(move_id))
  with check (public.is_move_owner(move_id));

grant select on public.move_members to authenticated;
grant select, insert, update on public.move_invites to authenticated;

revoke all on function public.is_move_owner(uuid) from public;
revoke all on function public.is_move_member(uuid) from public;
revoke all on function public.get_move_invite(text) from public;
revoke all on function public.accept_move_invite(text) from public;

grant execute on function public.is_move_owner(uuid) to authenticated;
grant execute on function public.is_move_member(uuid) to authenticated;
grant execute on function public.get_move_invite(text) to authenticated;
grant execute on function public.accept_move_invite(text) to authenticated;
