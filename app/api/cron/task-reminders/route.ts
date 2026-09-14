import { type NextRequest } from "next/server";

import { getCronSecret, getResendConfig, getServiceRoleKey } from "@/lib/env";
import { sendDueRemindersForAllMoves } from "@/lib/reminders";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = getCronSecret();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getResendConfig()) {
    return Response.json({
      ok: true,
      sent: 0,
      skipped: "RESEND_API_KEY is not set.",
    });
  }

  if (!getServiceRoleKey()) {
    return Response.json({
      ok: true,
      sent: 0,
      skipped: "SUPABASE_SERVICE_ROLE_KEY is not set.",
    });
  }

  try {
    const supabase = createServiceClient();
    const result = await sendDueRemindersForAllMoves(supabase);
    const status = result.error ? 500 : 200;
    return Response.json(result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reminder job failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
