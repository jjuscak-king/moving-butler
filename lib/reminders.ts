import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { CASE_FILE_LABEL, PRODUCT_NAME, PRODUCT_ROLE } from "@/lib/constants";
import { getResendConfig, getSiteUrl } from "@/lib/env";
import { todayInNyc } from "@/lib/task-state";

type Client = SupabaseClient<Database>;

function needsReminder(reminderSentOn: string | null, today: string): boolean {
  return !reminderSentOn || reminderSentOn < today;
}

export async function sendDueRemindersForMove(
  supabase: Client,
  moveId: string,
  today = todayInNyc(),
  options?: { respectPrefs?: boolean }
): Promise<{ error: string | null; sent: number; skipped: string | null }> {
  const resendConfig = getResendConfig();
  if (!resendConfig) {
    return {
      error: null,
      sent: 0,
      skipped:
        "RESEND_API_KEY is not set. Add it to .env.local (see README Week 2) to send mail.",
    };
  }

  const respectPrefs = options?.respectPrefs ?? true;

  const [{ data: move, error: moveError }, { data: tasks, error: taskError }, { data: members, error: memberError }] =
    await Promise.all([
      supabase.from("moves").select("id, label, user_id").eq("id", moveId).maybeSingle(),
      supabase
        .from("tasks")
        .select("id, title, due_date, status, reminder_sent_on, claimed_by")
        .eq("move_id", moveId)
        .neq("status", "done")
        .not("due_date", "is", null)
        .lte("due_date", today),
      supabase.from("move_members").select("email, role, user_id").eq("move_id", moveId),
    ]);

  if (moveError) return { error: moveError.message, sent: 0, skipped: null };
  if (taskError) return { error: taskError.message, sent: 0, skipped: null };
  if (memberError) return { error: memberError.message, sent: 0, skipped: null };
  if (!move) return { error: "Case File not found.", sent: 0, skipped: null };

  const dueTasks = (tasks ?? []).filter((task) => needsReminder(task.reminder_sent_on, today));
  if (dueTasks.length === 0) {
    return { error: null, sent: 0, skipped: "No due or overdue tasks need a reminder today." };
  }

  const recipientIds = new Set<string>([move.user_id]);
  for (const task of dueTasks) {
    if (task.claimed_by) recipientIds.add(task.claimed_by);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, reminders_enabled")
    .in("id", [...recipientIds]);

  const emailByUser = new Map<string, string>();
  for (const member of members ?? []) {
    if (member.email) emailByUser.set(member.user_id, member.email);
  }
  for (const profile of profiles ?? []) {
    if (profile.email) emailByUser.set(profile.id, profile.email);
  }

  const disabled = new Set(
    (profiles ?? [])
      .filter((profile) => respectPrefs && profile.reminders_enabled === false)
      .map((profile) => profile.id)
  );

  const recipients = [...recipientIds]
    .filter((userId) => !disabled.has(userId))
    .map((userId) => emailByUser.get(userId)?.trim())
    .filter((email): email is string => Boolean(email));

  const uniqueRecipients = [...new Set(recipients)];

  if (uniqueRecipients.length === 0) {
    return {
      error: null,
      sent: 0,
      skipped: "No eligible recipients (owner/assignee emails off or missing).",
    };
  }

  const siteUrl = getSiteUrl();
  const caseUrl = `${siteUrl}/moves/${move.id}`;
  const list = dueTasks
    .map((task) => {
      const when = task.due_date === today ? "due today" : `overdue (due ${task.due_date})`;
      return `<li><strong>${escapeHtml(task.title)}</strong> — ${when}</li>`;
    })
    .join("");

  const html = `
    <p>${PRODUCT_NAME} (${PRODUCT_ROLE}) reminder for the ${CASE_FILE_LABEL} <strong>${escapeHtml(move.label)}</strong>.</p>
    <p>These tasks are due or overdue:</p>
    <ul>${list}</ul>
    <p><a href="${caseUrl}">Open the Case File</a></p>
    <p style="color:#666;font-size:12px">This is orchestration software, not a moving company. One email channel only — no push notifications.</p>
  `;

  const resend = new Resend(resendConfig.apiKey);
  const { error } = await resend.emails.send({
    from: resendConfig.from,
    to: uniqueRecipients,
    subject: `Tasks due — ${move.label}`,
    html,
  });

  if (error) {
    return { error: error.message, sent: 0, skipped: null };
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ reminder_sent_on: today })
    .in(
      "id",
      dueTasks.map((task) => task.id)
    );

  if (updateError) {
    return { error: updateError.message, sent: 0, skipped: null };
  }

  return { error: null, sent: uniqueRecipients.length, skipped: null };
}

export async function sendDueRemindersForAllMoves(supabase: Client, today = todayInNyc()) {
  if (!getResendConfig()) {
    return {
      error: null,
      moves: 0,
      sent: 0,
      skipped: "RESEND_API_KEY is not set.",
      errors: [] as string[],
    };
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("move_id, due_date, status, reminder_sent_on")
    .neq("status", "done")
    .not("due_date", "is", null)
    .lte("due_date", today);

  if (error) {
    return { error: error.message, moves: 0, sent: 0, skipped: null, errors: [error.message] };
  }

  const moveIds = [
    ...new Set(
      (tasks ?? [])
        .filter((task) => needsReminder(task.reminder_sent_on, today))
        .map((task) => task.move_id)
    ),
  ];

  let sent = 0;
  const errors: string[] = [];
  for (const moveId of moveIds) {
    const result = await sendDueRemindersForMove(supabase, moveId, today, { respectPrefs: true });
    if (result.error) errors.push(result.error);
    sent += result.sent;
  }

  return {
    error: errors[0] ?? null,
    moves: moveIds.length,
    sent,
    skipped: moveIds.length === 0 ? "No due or overdue tasks need a reminder today." : null,
    errors,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
