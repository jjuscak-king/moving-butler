import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(join(root, "supabase/migrations/0001_init.sql"), "utf8");

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
  it("seeds every specialist workstream", () => {
    for (const key of stages) {
      assert.match(sql, new RegExp(`'${key}'`));
    }
  });

  it("includes the Week 1 minimum titles", () => {
    for (const title of minimumTitles) {
      assert.ok(sql.includes(title), `missing seed title: ${title}`);
    }
  });

  it("always includes COI and elevator admin tasks", () => {
    assert.ok(sql.includes("Request COI if needed"));
    assert.ok(sql.includes("Book elevator / loading dock"));
  });
});
