"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
  STAGE_KEYS,
  STAGE_STATUSES,
  type StageKey,
  type StageStatus,
} from "@/lib/constants";

export async function updateStageStatus(moveId: string, stageKey: StageKey, status: StageStatus) {
  if (!STAGE_KEYS.includes(stageKey) || !STAGE_STATUSES.includes(status)) {
    return { error: "Invalid stage or status." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("move_stages")
    .update({ status })
    .eq("move_id", moveId)
    .eq("stage_key", stageKey);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/moves/${moveId}`);
  return { error: null };
}
