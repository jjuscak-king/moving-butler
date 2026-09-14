export function safeInternalPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  if (next === "/login" || next === "/signup" || next.startsWith("/login?") || next.startsWith("/signup?")) {
    return "/";
  }
  return next;
}
