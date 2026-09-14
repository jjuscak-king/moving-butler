import { notFound } from "next/navigation";

import { MoveWorkspace } from "@/components/move-workspace";
import { requireUser } from "@/lib/auth";
import { CASE_FILE_LABEL_SHORT, STAGE_KEYS } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("moves").select("label").eq("id", id).maybeSingle();
  return { title: data?.label ?? CASE_FILE_LABEL_SHORT };
}

export default async function MoveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id } = await params;
  const { stage } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: move } = await supabase.from("moves").select("*").eq("id", id).maybeSingle();
  if (!move) notFound();

  const [{ data: stages }, { data: tasks }, { data: members }, { data: profile }] =
    await Promise.all([
      supabase.from("move_stages").select("*").eq("move_id", id).order("sort_order"),
      supabase.from("tasks").select("*").eq("move_id", id).order("sort_order"),
      supabase.from("move_members").select("*").eq("move_id", id).order("created_at"),
      supabase.from("profiles").select("reminders_enabled").eq("id", user.id).maybeSingle(),
    ]);

  const initialStage = STAGE_KEYS.includes(stage as (typeof STAGE_KEYS)[number])
    ? stage
    : undefined;

  return (
    <MoveWorkspace
      move={move}
      stages={stages ?? []}
      tasks={tasks ?? []}
      members={members ?? []}
      currentUserId={user.id}
      isOwner={move.user_id === user.id}
      remindersEnabled={profile?.reminders_enabled ?? true}
      initialStage={initialStage}
    />
  );
}
