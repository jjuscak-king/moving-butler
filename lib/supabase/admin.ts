import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getServiceRoleKey, requireSupabaseEnv } from "@/lib/env";

export function createServiceClient() {
  const { url } = requireSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Required for the due-task reminder cron."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
