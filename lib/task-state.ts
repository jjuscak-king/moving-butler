export function todayInNyc(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function isTaskOverdue(
  dueDate: string | null | undefined,
  status: string,
  today = todayInNyc()
): boolean {
  if (!dueDate || status === "done") return false;
  return dueDate < today;
}

export function isDueToday(
  dueDate: string | null | undefined,
  status: string,
  today = todayInNyc()
): boolean {
  if (!dueDate || status === "done") return false;
  return dueDate === today;
}

export function isTaskSoftBlocked(
  dependsOnTaskId: string | null | undefined,
  tasks: readonly { id: string; status: string }[]
): boolean {
  if (!dependsOnTaskId) return false;
  const dependency = tasks.find((task) => task.id === dependsOnTaskId);
  return Boolean(dependency && dependency.status !== "done");
}

export function dependencyTitle(
  dependsOnTaskId: string | null | undefined,
  tasks: readonly { id: string; title: string }[]
): string | null {
  if (!dependsOnTaskId) return null;
  return tasks.find((task) => task.id === dependsOnTaskId)?.title ?? null;
}

/** True when this task still needs a due/overdue reminder for `today` (YYYY-MM-DD, NYC). */
export function needsReminderToday(
  reminderSentOn: string | null | undefined,
  today: string
): boolean {
  return !reminderSentOn || reminderSentOn < today;
}

export function isReminderEligible(
  task: { due_date: string | null; status: string; reminder_sent_on?: string | null },
  today: string
): boolean {
  if (!task.due_date || task.status === "done") return false;
  if (task.due_date > today) return false;
  return needsReminderToday(task.reminder_sent_on ?? null, today);
}

/** Owner always; claimant only when the task is claimed. */
export function reminderRecipientIds(
  ownerId: string,
  tasks: readonly { claimed_by: string | null }[]
): string[] {
  const ids = new Set<string>([ownerId]);
  for (const task of tasks) {
    if (task.claimed_by) ids.add(task.claimed_by);
  }
  return [...ids];
}

export function filterReminderRecipients(
  recipientIds: readonly string[],
  profiles: readonly { id: string; reminders_enabled: boolean }[],
  respectPrefs: boolean
): string[] {
  if (!respectPrefs) return [...recipientIds];
  const disabled = new Set(
    profiles.filter((profile) => profile.reminders_enabled === false).map((profile) => profile.id)
  );
  return recipientIds.filter((id) => !disabled.has(id));
}
