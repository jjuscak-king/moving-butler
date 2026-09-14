"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateReminderPref } from "@/app/actions/profile";
import { createMoveInvite } from "@/app/actions/invites";
import { runMoveDueReminders } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";
import {
  CASE_FILE_LABEL,
  CASE_FILE_LABEL_SHORT,
  MEMBER_ROLE_LABELS,
  type MemberRole,
} from "@/lib/constants";
import type { MoveMemberRow } from "@/lib/database.types";

export function HouseholdPanel({
  moveId,
  members,
  isOwner,
  remindersEnabled,
}: {
  moveId: string;
  members: MoveMemberRow[];
  isOwner: boolean;
  remindersEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  return (
    <section className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <div>
        <h2 className="font-heading text-xl">Household</h2>
        <p className="text-sm text-muted-foreground">
          Co-movers can view, claim, and complete tasks. {CASE_FILE_LABEL} edits,
          invites, and deletes stay with the owner.
        </p>
      </div>
      <ul className="grid gap-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              {member.email || "Signed-in member"}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {MEMBER_ROLE_LABELS[member.role as MemberRole] ?? member.role}
            </span>
          </li>
        ))}
      </ul>
      {isOwner ? (
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            className="h-11 sm:h-10"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await createMoveInvite(moveId);
                if (result.error || !result.url) {
                  toast.error(result.error ?? "Could not create invite.");
                  return;
                }
                setInviteUrl(result.url);
                try {
                  await navigator.clipboard.writeText(result.url);
                  toast.success("Invite link copied");
                } catch {
                  toast.success("Invite link ready — copy it below");
                }
              });
            }}
          >
            Copy invite link
          </Button>
          <Button
            variant="outline"
            className="h-11 sm:h-10"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await runMoveDueReminders(moveId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                if (result.skipped) {
                  toast.message(result.skipped);
                  return;
                }
                toast.success(
                  result.sent
                    ? `Sent due-task reminder to ${result.sent} recipient${result.sent === 1 ? "" : "s"}`
                    : "No reminders sent"
                );
              });
            }}
          >
            Email due reminders
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You joined this {CASE_FILE_LABEL_SHORT} as a co-mover.
        </p>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={remindersEnabled}
          disabled={pending}
          onChange={(event) => {
            const enabled = event.target.checked;
            startTransition(async () => {
              const result = await updateReminderPref(enabled);
              if (result.error) toast.error(result.error);
              else toast.success(enabled ? "Due-task emails on" : "Due-task emails off");
            });
          }}
        />
        <span>
          Email me when a task is due today or overdue (Resend, once per NYC day). Scheduled
          reminders go to the owner and the person who claimed the task.
        </span>
      </label>
      {inviteUrl ? (
        <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs">{inviteUrl}</p>
      ) : null}
    </section>
  );
}
