"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { sendDueRemindersForMove } from "@/lib/reminders";

export async function runMoveDueReminders(moveId: string) {
  const { supabase, user } = await requireUser();
  const { data: move } = await supabase
    .from("moves")
    .select("id, user_id")
    .eq("id", moveId)
    .maybeSingle();

  if (!move || move.user_id !== user.id) {
    return { error: "Only the owner can send due-task reminders.", sent: 0, skipped: null };
  }

  const result = await sendDueRemindersForMove(supabase, moveId, undefined, {
    respectPrefs: false,
  });
  revalidatePath(`/moves/${moveId}`);
  return result;
}
