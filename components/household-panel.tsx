"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateReminderPref } from "@/app/actions/profile";
import {
  createMoveInvite,
  removeMoveMember,
  revokeMoveInvite,
} from "@/app/actions/invites";
import { runMoveDueReminders } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CASE_FILE_LABEL,
  CASE_FILE_LABEL_SHORT,
  MEMBER_ROLE_LABELS,
  type MemberRole,
} from "@/lib/constants";
import type { MoveInviteRow, MoveMemberRow } from "@/lib/database.types";

export function HouseholdPanel({
  moveId,
  members,
  invites,
  isOwner,
  remindersEnabled,
}: {
  moveId: string;
  members: MoveMemberRow[];
  invites: MoveInviteRow[];
  isOwner: boolean;
  remindersEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<MoveMemberRow | null>(null);

  const openInvites = invites.filter((invite) => !invite.revoked_at);

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
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {MEMBER_ROLE_LABELS[member.role as MemberRole] ?? member.role}
              </span>
              {isOwner && member.role !== "owner" ? (
                <Button
                  variant="outline"
                  className="h-10"
                  disabled={pending}
                  onClick={() => setPendingRemove(member)}
                >
                  Remove
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {isOwner && openInvites.length ? (
        <ul className="grid gap-2">
          {openInvites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed bg-background px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                Open invite · expires{" "}
                {new Date(invite.expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "America/New_York",
                })}
              </span>
              <Button
                variant="outline"
                className="h-10"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await revokeMoveInvite(moveId, invite.id);
                    if (result.error) toast.error(result.error);
                    else {
                      setInviteUrl(null);
                      toast.success("Invite revoked");
                    }
                  });
                }}
              >
                Revoke invite
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
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

      <Dialog open={!!pendingRemove} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this co-mover?</DialogTitle>
            <DialogDescription>
              {pendingRemove
                ? `${pendingRemove.email || "This member"} will lose access to the ${CASE_FILE_LABEL_SHORT}. Their claimed tasks will be released.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10"
              disabled={pending}
              onClick={() => {
                if (!pendingRemove) return;
                startTransition(async () => {
                  const result = await removeMoveMember(moveId, pendingRemove.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Co-mover removed");
                  setPendingRemove(null);
                });
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
