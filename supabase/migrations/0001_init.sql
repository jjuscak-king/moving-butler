-- Moving Butler Week 1: profiles, moves, stages, tasks + RLS
-- v1 architecture (three levels, not A+D+F): L1 Core Operating Framework,
-- L2 Relocation Operating System (Relocation Case File),
-- L3 Customer Services journey stages

create extension if not exists "pgcrypto";

do $$ begin
  create type public.borough as enum (
    'manhattan',
    'brooklyn',
    'queens',
    'bronx',
    'staten_island',
    'other_nyc_metro',
    'outside_nyc_metro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.home_size as enum (
    'studio',
    'one_br',
    'two_br',
    'three_br_plus',
    'house',
    'storage_only'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.access_type as enum (
    'elevator',
    'walk_up',
    'mixed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.service_mode as enum (
    'diy',
    'hybrid',
    'full_service',
    'unsure'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.stage_key as enum (
    'decide',
    'plan',
    'vendors',
    'admin',
    'move_day',
    'settle'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.stage_status as enum (
    'not_started',
    'in_progress',
    'blocked',
    'done'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum (
    'todo',
    'in_progress',
    'blocked',
    'done'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  from_address text not null,
  to_address text not null,
  from_borough public.borough not null,
  to_borough public.borough not null,
  window_start date not null,
  window_end date not null,
  home_size public.home_size not null,
  access_from public.access_type not null,
  access_to public.access_type not null,
  coi_required boolean not null default false,
  service_mode public.service_mode not null,
  budget_notes text,
  building_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moves_label_not_blank check (char_length(btrim(label)) > 0),
  constraint moves_from_address_not_blank check (char_length(btrim(from_address)) > 0),
  constraint moves_to_address_not_blank check (char_length(btrim(to_address)) > 0),
  constraint moves_window_end_gte_start check (window_end >= window_start)
);

create table if not exists public.move_stages (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves (id) on delete cascade,
  stage_key public.stage_key not null,
  status public.stage_status not null default 'not_started',
  sort_order integer not null,
  unique (move_id, stage_key)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves (id) on delete cascade,
  stage_key public.stage_key not null,
  title text not null,
  status public.task_status not null default 'todo',
  notes text,
  sort_order integer not null default 0,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_not_blank check (char_length(btrim(title)) > 0)
);

create index if not exists moves_user_id_idx on public.moves (user_id);
create index if not exists moves_created_at_idx on public.moves (user_id, created_at desc);
create index if not exists move_stages_move_id_idx on public.move_stages (move_id, sort_order);
create index if not exists tasks_move_id_idx on public.tasks (move_id, stage_key, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists moves_set_updated_at on public.moves;
create trigger moves_set_updated_at
before update on public.moves
for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Seed six L3 Customer Services journey stages + NYC residential checklist on every new move.
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
    -- Move day
    (new.id, 'move_day', 'Confirm crew time', 'Reconfirm arrival window with whoever you booked. Buildings are unforgiving.', 1, false),
    (new.id, 'move_day', 'Prep building access notes', 'COI on file, elevator pad time, walk-up path, super phone, loading dock.', 2, false),
    (new.id, 'move_day', 'Protect floors / elevators notes', 'Pads, runner, and door-jamb protection so the building does not charge you.', 3, false),
    -- Settle
    (new.id, 'settle', 'Unpack priorities', 'Beds, kitchen, and work setup before decorative boxes.', 1, false),
    (new.id, 'settle', 'Confirm utilities live', 'Power, gas, water, internet. Chase anything that did not flip on day one.', 2, false),
    (new.id, 'settle', '7-day open-task sweep', 'Walk remaining todos, returns, and building deposits one week in.', 3, false);

  return new;
end;
$$;

drop trigger if exists on_move_created_seed on public.moves;
create trigger on_move_created_seed
after insert on public.moves
for each row execute procedure public.seed_move_workstreams();

alter table public.profiles enable row level security;
alter table public.moves enable row level security;
alter table public.move_stages enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "moves_select_own" on public.moves;
create policy "moves_select_own"
  on public.moves for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "moves_insert_own" on public.moves;
create policy "moves_insert_own"
  on public.moves for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "moves_update_own" on public.moves;
create policy "moves_update_own"
  on public.moves for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "moves_delete_own" on public.moves;
create policy "moves_delete_own"
  on public.moves for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "move_stages_select_own" on public.move_stages;
create policy "move_stages_select_own"
  on public.move_stages for select
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "move_stages_insert_own" on public.move_stages;
create policy "move_stages_insert_own"
  on public.move_stages for insert
  to authenticated
  with check (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "move_stages_update_own" on public.move_stages;
create policy "move_stages_update_own"
  on public.move_stages for update
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "move_stages_delete_own" on public.move_stages;
create policy "move_stages_delete_own"
  on public.move_stages for delete
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  to authenticated
  with check (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  to authenticated
  using (exists (select 1 from public.moves m where m.id = move_id and m.user_id = auth.uid()));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.moves to authenticated;
grant select, insert, update, delete on public.move_stages to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
