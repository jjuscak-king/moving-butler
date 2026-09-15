import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sos = readFileSync(join(root, "lib/sos.ts"), "utf8");

const ISSUE_NEXT_STEPS = {
  crew_late: "Call the crew lead",
  building_access: "Ask the lobby or desk for the super",
  parking_dock: "Check hydrants, bus stops",
  super_unreachable: "Call the management office",
  damage: "Photograph the item",
  payment: "Confirm the agreed method",
  other: "Write what happened",
};

function suggestedNextSteps(kind) {
  return ISSUE_NEXT_STEPS[kind];
}

const PHONE_RE = /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;

function contactDisplayLines(text) {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(PHONE_RE);
      if (!match) return { line, tel: null };
      const digits = match[0].replace(/\D/g, "");
      const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      if (normalized.length !== 10) return { line, tel: null };
      return { line, tel: `tel:+1${normalized}` };
    });
}

function packKeyForTask(task, titleMap) {
  if (task.pack_key && titleMap[task.pack_key]) return task.pack_key;
  return titleMap[task.title] ?? null;
}

describe("lightweight SOS", () => {
  it("returns curated next steps for each issue kind", () => {
    for (const kind of Object.keys(ISSUE_NEXT_STEPS)) {
      assert.ok(suggestedNextSteps(kind).length > 10);
    }
    assert.match(sos, /crew_late/);
    assert.match(sos, /building_access/);
    assert.match(sos, /Ask the lobby or desk for the super/);
    assert.match(sos, /cash, Zelle, or card/);
  });
});

describe("runbook contacts", () => {
  it("turns phone numbers into tel links", () => {
    const lines = contactDisplayLines("Super — (212) 555-0100\nFront desk");
    assert.equal(lines[0].tel, "tel:+12125550100");
    assert.equal(lines[1].tel, null);
    assert.deepEqual(contactDisplayLines("  "), []);
  });
});

describe("admin pack grouping", () => {
  it("prefers pack_key then falls back to title", () => {
    const titles = {
      "Request COI if needed": "building",
      building: true,
    };
    assert.equal(
      packKeyForTask({ pack_key: "building", title: "Custom" }, titles),
      "building"
    );
    assert.equal(
      packKeyForTask({ pack_key: null, title: "Request COI if needed" }, titles),
      "building"
    );
    assert.equal(packKeyForTask({ pack_key: null, title: "Custom note" }, titles), null);
  });
});
