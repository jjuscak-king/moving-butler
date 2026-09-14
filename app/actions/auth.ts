"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/move-form";
import { safeInternalPath } from "@/lib/paths";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : null
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let supabase;
  try {
    ({ supabase } = await requireUserForAuthPage());
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Supabase is not configured." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : null
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  let supabase;
  try {
    ({ supabase } = await requireUserForAuthPage());
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Supabase is not configured." };
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const confirmNext = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: origin
      ? { emailRedirectTo: `${origin}/auth/confirm${confirmNext}` }
      : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    error:
      "Check your email to confirm the account, then sign in. For local setup you can disable Confirm email in Supabase Auth.",
  };
}

export async function signOut() {
  const { supabase } = await requireUserForAuthPage();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

async function requireUserForAuthPage() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return { supabase };
}
