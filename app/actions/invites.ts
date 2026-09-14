"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";

function inviteUrlForToken(token: string, origin: string) {
  return `${origin.replace(/\/$/, "")}/invite/${token}`;
}

async function requestOrigin() {
  const envOrigin = getSiteUrl();
  if (envOrigin && envOrigin !== "http://localhost:3000") {
    return envOrigin;
  }
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return envOrigin;
}

export async function createMoveInvite(moveId: string) {
  const { supabase, user } = await requireUser();
  const { data: move } = await supabase
    .from("moves")
    .select("id, user_id")
    .eq("id", moveId)
    .maybeSingle();

  if (!move || move.user_id !== user.id) {
    return { error: "Only the owner can invite a co-mover.", url: null as string | null };
  }

  const { data: existing } = await supabase
    .from("move_invites")
    .select("token, expires_at, revoked_at")
    .eq("move_id", moveId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const origin = await requestOrigin();

  if (existing) {
    return { error: null, url: inviteUrlForToken(existing.token, origin) };
  }

  const { data, error } = await supabase
    .from("move_invites")
    .insert({
      move_id: moveId,
      created_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create an invite.", url: null };
  }

  revalidatePath(`/moves/${moveId}`);
  return { error: null, url: inviteUrlForToken(data.token, origin) };
}

export async function acceptMoveInvite(token: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("accept_move_invite", { p_token: token });

  if (error || !data) {
    return { error: error?.message ?? "Could not join that Case File." };
  }

  revalidatePath("/");
  revalidatePath(`/moves/${data}`);
  redirect(`/moves/${data}`);
}
