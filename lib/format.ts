export function formatMoveDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMoveWindow(start: string, end: string) {
  if (start === end) return formatMoveDate(start);
  return `${formatMoveDate(start)} – ${formatMoveDate(end)}`;
}
