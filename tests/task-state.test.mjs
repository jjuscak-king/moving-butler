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

function needsReminderToday(reminderSentOn, today) {
  return !reminderSentOn || reminderSentOn < today;
}

function isReminderEligible(task, today) {
  if (!task.due_date || task.status === "done") return false;
  if (task.due_date > today) return false;
  return needsReminderToday(task.reminder_sent_on ?? null, today);
}

function reminderRecipientIds(ownerId, tasks) {
  const ids = new Set([ownerId]);
  for (const task of tasks) {
    if (task.claimed_by) ids.add(task.claimed_by);
  }
  return [...ids];
}

function filterReminderRecipients(recipientIds, profiles, respectPrefs) {
  if (!respectPrefs) return [...recipientIds];
  const disabled = new Set(
    profiles.filter((profile) => profile.reminders_enabled === false).map((profile) => profile.id)
  );
  return recipientIds.filter((id) => !disabled.has(id));
}

describe("due-task reminders (WEEK2-PRD-v0)", () => {
  const today = "2026-09-14";

  it("fires for due today or overdue, once per local day", () => {
    assert.equal(
      isReminderEligible({ due_date: today, status: "todo", reminder_sent_on: null }, today),
      true
    );
    assert.equal(
      isReminderEligible({ due_date: "2026-09-01", status: "todo", reminder_sent_on: null }, today),
      true
    );
    assert.equal(
      isReminderEligible({ due_date: "2026-09-15", status: "todo", reminder_sent_on: null }, today),
      false
    );
    assert.equal(
      isReminderEligible({ due_date: today, status: "done", reminder_sent_on: null }, today),
      false
    );
    assert.equal(
      isReminderEligible({ due_date: today, status: "todo", reminder_sent_on: today }, today),
      false
    );
  });

  it("emails the owner and the claimant, honoring prefs", () => {
    const tasks = [
      { claimed_by: null },
      { claimed_by: "co-mover" },
    ];
    const ids = reminderRecipientIds("owner", tasks);
    assert.deepEqual(ids.sort(), ["co-mover", "owner"]);
    assert.deepEqual(
      filterReminderRecipients(ids, [{ id: "co-mover", reminders_enabled: false }], true).sort(),
      ["owner"]
    );
  });
});
