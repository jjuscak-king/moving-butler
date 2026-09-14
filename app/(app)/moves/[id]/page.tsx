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
  const { supabase } = await requireUser();

  const { data: move } = await supabase.from("moves").select("*").eq("id", id).maybeSingle();
  if (!move) notFound();

  const [{ data: stages }, { data: tasks }] = await Promise.all([
    supabase.from("move_stages").select("*").eq("move_id", id).order("sort_order"),
    supabase.from("tasks").select("*").eq("move_id", id).order("sort_order"),
  ]);

  const initialStage = STAGE_KEYS.includes(stage as (typeof STAGE_KEYS)[number])
    ? stage
    : undefined;

  return (
    <MoveWorkspace
      move={move}
      stages={stages ?? []}
      tasks={tasks ?? []}
      initialStage={initialStage}
    />
  );
}
