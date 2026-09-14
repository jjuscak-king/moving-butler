import assert from "node:assert/strict";
import { describe, it } from "node:test";

function isTaskOverdue(dueDate, status, today) {
  if (!dueDate || status === "done") return false;
  return dueDate < today;
}

function isDueToday(dueDate, status, today) {
  if (!dueDate || status === "done") return false;
  return dueDate === today;
}

function isTaskSoftBlocked(dependsOnTaskId, tasks) {
  if (!dependsOnTaskId) return false;
  const dependency = tasks.find((task) => task.id === dependsOnTaskId);
  return Boolean(dependency && dependency.status !== "done");
}

describe("task due dates", () => {
  it("flags overdue when the date is before today and not done", () => {
    assert.equal(isTaskOverdue("2026-09-01", "todo", "2026-09-14"), true);
    assert.equal(isTaskOverdue("2026-09-01", "done", "2026-09-14"), false);
    assert.equal(isTaskOverdue(null, "todo", "2026-09-14"), false);
  });

  it("flags due today", () => {
    assert.equal(isDueToday("2026-09-14", "todo", "2026-09-14"), true);
    assert.equal(isDueToday("2026-09-13", "todo", "2026-09-14"), false);
  });
});

describe("simple dependencies", () => {
  const tasks = [
    { id: "a", status: "todo" },
    { id: "b", status: "done" },
  ];

  it("soft-blocks until the dependency is done", () => {
    assert.equal(isTaskSoftBlocked("a", tasks), true);
    assert.equal(isTaskSoftBlocked("b", tasks), false);
    assert.equal(isTaskSoftBlocked(null, tasks), false);
  });
});
