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
});
