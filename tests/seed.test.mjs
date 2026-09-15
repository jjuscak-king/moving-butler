import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase/migrations");
const sql = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
  .join("\n");

const stages = ["decide", "plan", "vendors", "admin", "move_day", "settle"];
const minimumTitles = [
  "Confirm move date window",
  "Confirm DIY vs full-service",
  "Rough inventory / size check",
  "Create room pack order",
  "Order packing supplies",
  "Share plan with household",
  "Book movers",
  "Book packing help if needed",
  "Reserve truck/parking if DIY",
  "Request COI if needed",
  "Book elevator / loading dock",
  "Start change-of-address list",
  "Utilities shutoff/start list",
  "Internet transfer",
  "Confirm crew time",
  "Prep building access notes",
  "Protect floors / elevators notes",
  "Unpack priorities",
  "Confirm utilities live",
  "7-day open-task sweep",
];

describe("NYC checklist seed", () => {
  it("seeds every journey stage", () => {
    for (const key of stages) {
      assert.match(sql, new RegExp(`'${key}'`));
    }
  });

  it("includes the Week 1 minimum titles", () => {
    for (const title of minimumTitles) {
      assert.ok(sql.includes(title), `missing seed title: ${title}`);
    }
  });

  it("always includes the NYC constraint pack", () => {
    assert.ok(sql.includes("Request COI if needed"));
    assert.ok(sql.includes("Book elevator / loading dock"));
    assert.ok(sql.includes("Loading dock reservation notes"));
    assert.ok(sql.includes("Street parking notes"));
  });
});

describe("Week 2 schema", () => {
  it("adds due dates, dependencies, and claim columns", () => {
    assert.match(sql, /due_date date/);
    assert.match(sql, /depends_on_task_id/);
    assert.match(sql, /claimed_by/);
    assert.match(sql, /reminder_sent_on/);
  });

  it("adds move membership and invite tables", () => {
    assert.match(sql, /create table if not exists public\.move_members/);
    assert.match(sql, /create table if not exists public\.move_invites/);
    assert.match(sql, /accept_move_invite/);
    assert.match(sql, /is_move_member/);
  });

  it("soft-blocks Move-day critical tasks on the COI admin task", () => {
    assert.match(sql, /Request COI if needed/);
    assert.match(sql, /depends_on_task_id = coi\.id/);
    assert.match(sql, /Confirm crew time/);
    assert.match(sql, /Prep building access notes/);
    assert.doesNotMatch(
      sql,
      /depends_on_task_id = coi\.id,\s*status = 'blocked'/
    );
  });

  it("stores a per-user reminder preference", () => {
    assert.match(sql, /reminders_enabled boolean not null default true/);
  });

  it("keeps owner-only deletes for Case File-level irreversible actions", () => {
    assert.match(sql, /is_move_owner\(move_id\)/);
    assert.match(sql, /tasks_delete_own/);
    assert.match(sql, /move_invites_insert_owner/);
  });
});

describe("Week 3 schema", () => {
  it("adds Admin pack tags, building note fields, and the issue log", () => {
    assert.match(sql, /admin_pack text/);
    assert.match(sql, /mgmt_name text/);
    assert.match(sql, /mgmt_phone text/);
    assert.match(sql, /elevator_window_notes text/);
    assert.match(sql, /loading_dock_notes text/);
    assert.match(sql, /coi_status_notes text/);
    assert.match(sql, /create table if not exists public\.move_issues/);
    assert.match(sql, /move_issues_insert_member/);
  });

  it("seeds change-of-address, utilities, internet, and insurance pack titles", () => {
    for (const title of [
      "NYC.gov / 311 address",
      "Banks, payroll, and subscriptions",
      "NY DMV / ID address",
      "National Grid gas if applicable",
      "NYC DEP water/sewer",
      "Confirm internet install window",
      "Renters insurance at destination",
      "Confirm mover valuation / insurance",
    ]) {
      assert.ok(sql.includes(title), `missing Week 3 seed title: ${title}`);
    }
    assert.match(sql, /'coa'/);
    assert.match(sql, /'utilities'/);
    assert.match(sql, /'internet'/);
    assert.match(sql, /'insurance'/);
    assert.match(sql, /'building'/);
  });

  it("lets the owner delete a co-mover membership", () => {
    assert.match(sql, /move_members_delete_owner/);
    assert.match(sql, /role <> 'owner'/);
  });
});
