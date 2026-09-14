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
