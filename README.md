# Moving Butler

NYC-first residential move orchestration SaaS — software, **not** a moving company.

Motto: help a household complete a successful NYC relocation through a managed workstream, not by becoming the mover.

Week 1 ships architecture slice **A + D-shell + F**:

- **A** Customer & outcome — auth + NYC Move Profile
- **D-shell** Six specialist workstreams (Decide → Plan → Vendors → Admin → Move day → Settle)
- **F** Execution — checklist CRUD with an NYC seed

Provisional strategy: NYC metro · B2C · SaaS spine · later “I booked this” vendor capture. **No marketplace in Week 1.**

## Stack

Next.js App Router (v16) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase Auth / Postgres / RLS · Vercel-ready

## Auth choice

**Email + password** via Supabase Auth (not magic link).

- Sign up, sign in, sign out
- Session cookies via `@supabase/ssr` (refreshed in `proxy.ts`)
- Protected routes redirect to `/login`

Why password: it works locally without SMTP. If Confirm email is enabled, sign-up sends a confirmation link to `/auth/confirm`. For the fastest local loop, turn **Confirm email** off under Authentication → Providers → Email.

OAuth / social login is out of scope.

## Local setup

### 1. Install

```bash
npm install
cp .env.local.example .env.local
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Project Settings → API: copy **Project URL** and **anon / public** key.
3. Paste them into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

A service-role key is **not** required. The app uses the user JWT + RLS.

### 3. Apply the migration

SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run.

That creates `profiles`, `moves`, `move_stages`, `tasks`, RLS policies, and a trigger that seeds the six stages plus the NYC checklist whenever a move is inserted.

Optional CLI (if you use the Supabase CLI against this project):

```bash
npx supabase db push
```

### 4. Auth settings

Authentication → Providers → Email:

- Enable Email
- For local/dev, disable **Confirm email** so sign-up creates a session immediately
- Leave social providers off

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to sign in.

```bash
npm run lint
npm test
npm run build
```

## Deploy on Vercel

1. Import the GitHub repo into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Optional: `NEXT_PUBLIC_SITE_URL` = your production origin (used for email confirm redirects).
4. In Supabase Auth, add the Vercel URL to **Redirect URLs** (`https://YOUR_DOMAIN/auth/confirm`).

## What Week 1 includes

- NYC Move Profile: create / edit / delete (label, from/to address + borough, date window with end ≥ start, home size, access, COI, DIY vs full-service, optional notes)
- Moves list (including a single card) and empty state **Create your first move**
- Fixed six-stage timeline; manual status: Not started | In progress | Blocked | Done
- Selecting a stage focuses that stage’s checklist
- Seeded tasks (≥1 per stage, fuller NYC Admin cluster). COI and elevator tasks always appear and are marked optional
- Task CRUD with confirm-on-delete; Blocked is visually distinct
- Mobile-first (~375px) tap targets

## Out of scope (not in this repo)

Co-mover invites, due dates/dependencies/reminders, vendor capture or marketplace, Admin curated packs beyond the seed, Move-day/Settle special UIs, subscription/paywall, native apps, OAuth.

## Data model

| Table | RLS |
| --- | --- |
| `profiles` | `id = auth.uid()` |
| `moves` | `user_id = auth.uid()` |
| `move_stages` | via owning move |
| `tasks` | via owning move |

Users only read/write their own moves and related rows.
