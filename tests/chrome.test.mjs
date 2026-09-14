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
    const banner = readFileSync(join(root, "components/nyc-constraint-banner.tsx"), "utf8");
    assert.match(workspace, /Blocked by/);
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
