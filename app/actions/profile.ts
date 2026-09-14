"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";

export async function updateReminderPref(enabled: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ reminders_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
