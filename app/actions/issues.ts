"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { ISSUE_KINDS, suggestedNextSteps, type IssueKind } from "@/lib/sos";

const issueSchema = z.object({
  kind: z.enum(ISSUE_KINDS),
  details: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

function revalidateMoveDay(moveId: string) {
  revalidatePath(`/moves/${moveId}`);
  revalidatePath(`/moves/${moveId}/move-day`);
}

export async function logMoveIssue(
  moveId: string,
  input: { kind: string; details?: string }
) {
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pick an issue type.", issue: null };
  }

  const { supabase, user } = await requireUser();
  const kind = parsed.data.kind as IssueKind;
  const nextSteps = suggestedNextSteps(kind);

  const { data, error } = await supabase
    .from("move_issues")
    .insert({
      move_id: moveId,
      kind,
      details: parsed.data.details,
      next_steps: nextSteps,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not log that issue.", issue: null };
  }

  revalidateMoveDay(moveId);
  return { error: null, issue: data };
}
