export function formatMoveDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  // Date-only values are stored as UTC calendar dates and labeled in NYC.
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function formatMoveWindow(start: string, end: string) {
  if (start === end) return formatMoveDate(start);
  return `${formatMoveDate(start)} – ${formatMoveDate(end)}`;
}
