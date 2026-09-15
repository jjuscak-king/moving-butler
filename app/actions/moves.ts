"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/move-form";
import { parseMoveForm } from "@/lib/move-form";

function firstFieldError(fieldErrors?: Record<string, string[] | undefined>) {
  if (!fieldErrors) return "Please fix the highlighted fields.";
  for (const messages of Object.values(fieldErrors)) {
    if (messages?.[0]) return messages[0];
  }
  return "Please fix the highlighted fields.";
}

export async function createMove(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseMoveForm(formData);
  if (!parsed.success) {
    return {
      error: firstFieldError(parsed.error.flatten().fieldErrors),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase, user } = await requireUser();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("moves")
    .insert({
      user_id: user.id,
      label: values.label,
      from_address: values.from_address,
      to_address: values.to_address,
      from_borough: values.from_borough,
      to_borough: values.to_borough,
      window_start: values.window_start,
      window_end: values.window_end,
      home_size: values.home_size,
      access_from: values.access_from,
      access_to: values.access_to,
      coi_required: values.coi_required,
      service_mode: values.service_mode,
      budget_notes: values.budget_notes || null,
      building_notes: values.building_notes || null,
      key_contacts: values.key_contacts || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create the Case File." };
  }

  revalidatePath("/");
  redirect(`/moves/${data.id}`);
}

export async function updateMove(
  moveId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseMoveForm(formData);
  if (!parsed.success) {
    return {
      error: firstFieldError(parsed.error.flatten().fieldErrors),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireUser();
  const values = parsed.data;

  const { error } = await supabase
    .from("moves")
    .update({
      label: values.label,
      from_address: values.from_address,
      to_address: values.to_address,
      from_borough: values.from_borough,
      to_borough: values.to_borough,
      window_start: values.window_start,
      window_end: values.window_end,
      home_size: values.home_size,
      access_from: values.access_from,
      access_to: values.access_to,
      coi_required: values.coi_required,
      service_mode: values.service_mode,
      budget_notes: values.budget_notes || null,
      building_notes: values.building_notes || null,
      key_contacts: values.key_contacts || null,
    })
    .eq("id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/moves/${moveId}`);
  redirect(`/moves/${moveId}`);
}

export async function deleteMove(moveId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("moves").delete().eq("id", moveId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
