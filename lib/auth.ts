import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function requireUser() {
  const result = await getUser();
  if (!result.user) {
    redirect("/login");
  }
  return { supabase: result.supabase, user: result.user };
}
