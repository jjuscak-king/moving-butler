# Moving Butler

**AI Relocation Manager** — software that orchestrates a relocation, **not** a moving or trucking company.

Motto: help a household complete a successful NYC relocation through a managed workstream, not by becoming the mover.

The system noun for a move is the **Relocation Case File** (UI may still say “move” in casual places; routes stay `/moves`).

## Architecture (v1 — three levels)

v1 has **three** architecture levels. Journey stages are a path *through* L3, not a fourth type, and not the old A + D-shell + F slice labels.

| Level | Name | What it is |
| --- | --- | --- |
| **L1** | Core Operating Framework | Auth, session, app shell |
| **L2** | Relocation Operating System | Relocation Case File and the operating record of the move |
| **L3** | Customer Services | Journey stages as a path through L3: Decide → Plan → Vendors → Admin → Move day → Settle |

Week 1 ships a thin slice of all three: auth (L1) + Case File create/edit (L2) + six L3 stages with checklist execution. Week 2 stays on that CORE: due dates, simple dependencies, email reminders, co-mover membership. Week 3 stays on that CORE: Admin packs, Move-day runbook, lightweight SOS. **No marketplace.**

Provisional strategy: NYC metro · B2C · SaaS spine · later “I booked this” vendor capture.

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

A service-role key is **not** required for day-to-day use. The app uses the user JWT + RLS. Week 2’s unattended reminder cron does need a service-role key (see below).

### 3. Apply the migrations

SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run.

Then paste `supabase/migrations/0002_week2.sql` → Run.

Then paste `supabase/migrations/0003_week3.sql` → Run.

`0001` creates `profiles`, `moves`, `move_stages`, `tasks`, RLS, and the seed trigger. `0002` adds due dates, simple `depends_on`, move membership / invite links, and extends the NYC constraint pack (COI, elevator, loading dock, parking). `0003` adds Admin pack tags (`admin_pack`), structured building notes, the Move-day issue log, and owner remove-co-mover. Existing Case Files are backfilled.

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

Open [http://localhost:3000](http://localhost:3000). You should be redirected to sign in. The first screen names **AI Relocation Manager** and states that this is orchestration software, not a moving company.

```bash
npm run lint
npm test
npm run build
```

## Deploy on Vercel

1. Import the GitHub repo into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Optional: `NEXT_PUBLIC_SITE_URL` = your production origin (used for email confirm redirects and invite links).
4. For due-task emails: `RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. In Supabase Auth, add the Vercel URL to **Redirect URLs** (`https://YOUR_DOMAIN/auth/confirm`).

## What Week 1 includes

- Relocation Case File: create / edit / delete (label, from/to address + borough, date window with end ≥ start, home size, access, COI, DIY vs full-service, optional notes)
- Case File list (including a single card) and empty state **Create your first Case File**
- Fixed six journey stages; manual status: Not started | In progress | Blocked | Done
- Selecting a stage focuses that stage’s checklist
- Seeded tasks (≥1 per stage, fuller NYC Admin cluster). COI and elevator tasks always appear and are marked optional
- Task CRUD with confirm-on-delete; Blocked is visually distinct
- Mobile-first (~375px) tap targets

## What Week 2 includes

- Optional **due dates** on tasks (date-only, labeled in America/New_York), with overdue / due-today flags
- **Simple dependencies** (`depends_on_task_id`): one task can wait on another. Seed wires **Request COI if needed** before Move-day critical tasks. Soft-block UI + “Blocked by …” warning — not a hard lock or critical-path engine
- **Email reminders** via **Resend** only (no push). Due today or overdue; once per task per NYC calendar day; owner and the claimant if the task is claimed. Per-user enable/disable pref. Soft-fails if `RESEND_API_KEY` is missing
- **Co-mover invite**: owner copies a link; invitee signs up or signs in and joins the Case File. Members can view, claim, and complete tasks. RLS is membership, not owner-only
- Approval rule: Case File edit/delete, invite creation, and task delete stay **owner-only** (money / legal / irreversible)
- NYC constraint pack: in-app banner plus seed tasks for COI, elevator, loading dock, parking notes

## Week 2 setup (email + cron)

Pick **one** channel: email. This repo uses [Resend](https://resend.com).

1. Create a Resend account and API key.
2. For the fastest dogfood loop, send from Resend’s onboarding address (`beth.t@example.com`) to the inbox you used to sign up for Resend. For production, verify a domain and set `RESEND_FROM_EMAIL`.
3. Add to `.env.local` / Vercel:

```bash
RESEND_API_KEY=re_xxxxxxxxx
# Optional. Defaults to Moving Butler <beth.t@example.com>
RESEND_FROM_EMAIL=Moving Butler <butler@YOUR_DOMAIN>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Unattended daily cron (Vercel Cron hits GET /api/cron/task-reminders at 13:00 UTC)
CRON_SECRET=generate-a-long-random-string
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Project Settings → API in Supabase: copy the **service_role** key only for this cron. Do not expose it to the browser.

**Dogfood without waiting for cron:** on a Case File you own, use **Email due reminders**. That sends for that Case File using your session (no service-role key). Tasks need a due date of today or earlier. Scheduled cron mail goes to the owner and the claimant; toggle “Email me when a task is due” off to skip the daily job for your inbox. Missing `RESEND_API_KEY` is a soft skip, not a crash.

**Local cron-shaped check:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/task-reminders
```

On Vercel, `vercel.json` registers a daily GET to that path. Set the same `CRON_SECRET` in the project env; Vercel sends `Authorization: Bearer $CRON_SECRET`. Hobby plans support a daily cron. This is not push notifications.

## What Week 3 includes

Aligned to locked **WEEK3-PRD-v0**.

- **Admin packs (A1–A5)** — Hub of five packs (`coa`, `utilities`, `internet`, `insurance`, `building`) with **done/total**. Pack detail lists tasks. Curated links use `target="_blank" rel="noopener"` plus a software-not-filing disclaimer. Pre-Week 3 Case Files are backfilled with an `admin_pack` tag (title heuristic if the tag is missing). Done / Blocked stay first-class on pack tasks.
- **Building notes (B1–B3)** — Keep `building_notes`. Nullable `mgmt_name`, `mgmt_phone`, `elevator_window_notes`, `loading_dock_notes`, `coi_status_notes`. Owner edits on the Case File; co-movers view. Surfaced on Move day.
- **Move-day runbook** at `/moves/[id]/move-day` — single phone-width (~375px) screen: contacts, access notes, payment reminder, issue log.
- **Lightweight SOS**: log a move-day issue, get static suggested next steps. No agent.
- Owner can **revoke** an open invite and **remove** a co-mover. NYC banner chips deep-link to `?stage=admin&pack=building`.

## Out of scope (not in this repo)

Vendor capture or marketplace, Week 4 paywall, native apps, OAuth, push notifications, renaming `/moves` routes.

## Data model

| Table | RLS |
| --- | --- |
| `profiles` | `id = auth.uid()` |
| `moves` | select: members of the move; insert/update/delete: owner (`user_id`) |
| `move_members` | select: members of the move; delete: owner (co-movers only; writes also via owner trigger / invite RPC) |
| `move_invites` | owner of the move |
| `move_stages` | select/update: members; insert/delete: owner |
| `tasks` | select/insert/update: members; delete: owner |
| `move_issues` | select/insert: members |

`tasks.due_date` is optional. `tasks.depends_on_task_id` is a single same-Case-File dependency. `tasks.admin_pack` tags Admin hub work (`coa` | `utilities` | `internet` | `insurance` | `building`). Building notes keep `building_notes` plus nullable `mgmt_name`, `mgmt_phone`, `elevator_window_notes`, `loading_dock_notes`, `coi_status_notes`. Table names stay `moves*` (URLs `/moves`); the product noun is Relocation Case File.
