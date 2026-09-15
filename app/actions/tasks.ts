"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { adminPackForTask } from "@/lib/admin-packs";
import {
  STAGE_KEYS,
  TASK_STATUSES,
  type StageKey,
  type TaskStatus,
} from "@/lib/constants";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Due date must be a calendar date.",
  });

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value !== "none" ? value : null))
  .refine(
    (value) =>
      value === null ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    { message: "Invalid dependency." }
  );

const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  stage_key: z.enum(STAGE_KEYS),
  status: z.enum(TASK_STATUSES),
  notes: z.string().trim().optional(),
  is_optional: z.boolean().optional(),
  due_date: optionalDate,
  depends_on_task_id: optionalId,
});

function revalidateMove(moveId: string) {
  revalidatePath(`/moves/${moveId}`);
  revalidatePath(`/moves/${moveId}/move-day`);
  revalidatePath("/");
}

type TaskInput = {
  title: string;
  stage_key: StageKey;
  status: TaskStatus;
  notes?: string;
  is_optional?: boolean;
  due_date?: string | null;
  depends_on_task_id?: string | null;
};

async function assertDependency(
  moveId: string,
  dependsOnTaskId: string | null,
  excludeTaskId?: string
) {
  const { supabase } = await requireUser();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, status, depends_on_task_id")
    .eq("move_id", moveId);

  if (error) {
    return { error: error.message };
  }

  const list = tasks ?? [];
  if (dependsOnTaskId && excludeTaskId && dependsOnTaskId === excludeTaskId) {
    return { error: "A task cannot depend on itself." };
  }

  if (dependsOnTaskId) {
    const dependency = list.find((task) => task.id === dependsOnTaskId);
    if (!dependency) {
      return { error: "Dependency must be another task on this Case File." };
    }
    if (dependency.depends_on_task_id === excludeTaskId) {
      return { error: "That would create a circular dependency." };
    }
  }

  return { error: null };
}

export async function createTask(moveId: string, input: TaskInput) {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }

  const blocked = await assertDependency(moveId, parsed.data.depends_on_task_id);
  if (blocked.error) return { error: blocked.error };

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
    due_date: parsed.data.due_date,
    depends_on_task_id: parsed.data.depends_on_task_id,
    admin_pack:
      parsed.data.stage_key === "admin" ? adminPackForTask(parsed.data) : null,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}

export async function updateTask(moveId: string, taskId: string, input: TaskInput) {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }

  const blocked = await assertDependency(
    moveId,
    parsed.data.depends_on_task_id,
    taskId
  );
  if (blocked.error) return { error: blocked.error };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      stage_key: parsed.data.stage_key,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      is_optional: parsed.data.is_optional ?? false,
      due_date: parsed.data.due_date,
      depends_on_task_id: parsed.data.depends_on_task_id,
      admin_pack:
        parsed.data.stage_key === "admin" ? adminPackForTask(parsed.data) : null,
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

export async function claimTask(moveId: string, taskId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({ claimed_by: user.id })
    .eq("id", taskId)
    .eq("move_id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidateMove(moveId);
  return { error: null };
}

export async function unclaimTask(moveId: string, taskId: string) {
  const { supabase, user } = await requireUser();
  const { data: task, error: loadError } = await supabase
    .from("tasks")
    .select("claimed_by, move_id")
    .eq("id", taskId)
    .eq("move_id", moveId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!task) return { error: "Task not found." };

  const { data: move } = await supabase
    .from("moves")
    .select("user_id")
    .eq("id", moveId)
    .maybeSingle();

  if (task.claimed_by !== user.id && move?.user_id !== user.id) {
    return { error: "Only the claimer or the owner can release this task." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ claimed_by: null })
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
