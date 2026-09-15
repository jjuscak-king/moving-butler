import { notFound } from "next/navigation";

import { MoveDayRunbook } from "@/components/move-day-runbook";
import { requireUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("moves").select("label").eq("id", id).maybeSingle();
  return { title: data ? `Move-day runbook · ${data.label}` : "Move-day runbook" };
}

export default async function MoveDayRunbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: move } = await supabase.from("moves").select("*").eq("id", id).maybeSingle();
  if (!move) notFound();

  const [{ data: members }, { data: issues }] = await Promise.all([
    supabase.from("move_members").select("*").eq("move_id", id).order("created_at"),
    supabase.from("move_issues").select("*").eq("move_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <MoveDayRunbook
      move={move}
      members={members ?? []}
      issues={issues ?? []}
      isOwner={move.user_id === user.id}
    />
  );
}
