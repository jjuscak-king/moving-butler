"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  STAGE_KEYS,
  TASK_STATUSES,
  type StageKey,
  type TaskStatus,
} from "@/lib/constants";

const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  stage_key: z.enum(STAGE_KEYS),
  status: z.enum(TASK_STATUSES),
  notes: z.string().trim().optional(),
  is_optional: z.boolean().optional(),
});

function revalidateMove(moveId: string) {
  revalidatePath(`/moves/${moveId}`);
  revalidatePath("/");
}

export async function createTask(
  moveId: string,
  input: {
    title: string;
    stage_key: StageKey;
    status: TaskStatus;
    notes?: string;
    is_optional?: boolean;
  }
) {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }

  const { supabase } = await requireUser();

  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("move_id", moveId)
    .eq("stage_key", parsed.data.stage_key)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tasks").insert({
    move_id: moveId,
    title: parsed.data.title,
    stage_key: parsed.data.stage_key,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
    is_optional: parsed.data.is_optional ?? false,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}

export async function updateTask(
  moveId: string,
  taskId: string,
  input: {
    title: string;
    stage_key: StageKey;
    status: TaskStatus;
    notes?: string;
    is_optional?: boolean;
  }
) {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      stage_key: parsed.data.stage_key,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      is_optional: parsed.data.is_optional ?? false,
    })
    .eq("id", taskId)
    .eq("move_id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}

export async function updateTaskStatus(moveId: string, taskId: string, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("move_id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}

export async function deleteTask(moveId: string, taskId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("move_id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}
