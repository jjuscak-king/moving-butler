import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("consumer chrome language", () => {
  it("does not show L3 in app or component strings", () => {
    const files = [...walk(join(root, "app")), ...walk(join(root, "components"))];
    const hits = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/\bL3\b/.test(text)) {
        hits.push(file.slice(root.length + 1));
      }
    }
    assert.deepEqual(hits, []);
  });

  it("shows a Blocked by warning and NYC constraint banner", () => {
    const workspace = readFileSync(join(root, "components/move-workspace.tsx"), "utf8");
    const taskCard = readFileSync(join(root, "components/task-card.tsx"), "utf8");
    const banner = readFileSync(join(root, "components/nyc-constraint-banner.tsx"), "utf8");
    assert.match(workspace, /Blocked by|TaskCard/);
    assert.match(taskCard, /Blocked by/);
    assert.match(banner, /NYC constraint pack/);
    assert.match(banner, /COI/);
    assert.match(banner, /loading dock/);
    assert.match(banner, /parking/);
  });

  it("does not hard-lock completing a dependent task", () => {
    const tasks = readFileSync(join(root, "app/actions/tasks.ts"), "utf8");
    assert.doesNotMatch(tasks, /Blocked until/);
    assert.match(tasks, /export async function claimTask/);
    assert.match(tasks, /claimed_by: user\.id/);
  });

  it("joins co-movers via invite token into move_members", () => {
    const invites = readFileSync(join(root, "app/actions/invites.ts"), "utf8");
    assert.match(invites, /accept_move_invite/);
    assert.match(invites, /\/invite\//);
  });
});

describe("Week 3 chrome", () => {
  it("groups Admin work into packs with Done and Blocked", () => {
    const packs = readFileSync(join(root, "components/admin-packs.tsx"), "utf8");
    const meta = readFileSync(join(root, "lib/admin-packs.ts"), "utf8");
    const card = readFileSync(join(root, "components/task-card.tsx"), "utf8");
    assert.match(packs, /Admin packs/);
    assert.match(packs, /Back to packs/);
    assert.match(packs, /rel="noopener"/);
    assert.match(meta, /"coa"/);
    assert.match(meta, /"utilities"/);
    assert.match(meta, /"internet"/);
    assert.match(meta, /"insurance"/);
    assert.match(meta, /"building"/);
    assert.match(meta, /ADMIN_PACK_DISCLAIMER/);
    assert.match(meta, /not a filing service/);
    assert.match(card, /showQuickStatus/);
    assert.match(card, />\s*Done\s*</);
    assert.match(card, />\s*Blocked\s*</);
  });

  it("surfaces building notes on Admin and Move day", () => {
    const workspace = readFileSync(join(root, "components/move-workspace.tsx"), "utf8");
    const notes = readFileSync(join(root, "components/building-notes-card.tsx"), "utf8");
    const form = readFileSync(join(root, "components/move-form.tsx"), "utf8");
    assert.match(notes, /Building \/ management notes/);
    assert.match(notes, /View only/);
    assert.match(form, /mgmt_name/);
    assert.match(form, /mgmt_phone/);
    assert.match(form, /elevator_window_notes/);
    assert.match(form, /loading_dock_notes/);
    assert.match(form, /coi_status_notes/);
    assert.match(workspace, /selected === "admin" \|\| selected === "move_day"/);
  });

  it("has a phone Move-day runbook with SOS", () => {
    const runbook = readFileSync(join(root, "components/move-day-runbook.tsx"), "utf8");
    const sos = readFileSync(join(root, "components/sos-panel.tsx"), "utf8");
    const page = readFileSync(join(root, "app/(app)/moves/[id]/move-day/page.tsx"), "utf8");
    assert.match(page, /MoveDayRunbook/);
    assert.match(runbook, /Contacts/);
    assert.match(runbook, /Access notes/);
    assert.match(runbook, /Payment reminder/);
    assert.match(runbook, /max-w-\[375px\]/);
    assert.match(sos, /Log an issue \(SOS\)/);
    assert.match(sos, /Suggested next steps/);
  });

  it("deep-links NYC banner chips into the Admin building pack", () => {
    const banner = readFileSync(join(root, "components/nyc-constraint-banner.tsx"), "utf8");
    assert.match(banner, /stage=admin&pack=/);
  });

  it("lets the owner revoke an invite and remove a co-mover", () => {
    const invites = readFileSync(join(root, "app/actions/invites.ts"), "utf8");
    const household = readFileSync(join(root, "components/household-panel.tsx"), "utf8");
    assert.match(invites, /revokeMoveInvite/);
    assert.match(invites, /removeMoveMember/);
    assert.match(household, /Revoke invite/);
    assert.match(household, /Remove this co-mover/);
  });
});
