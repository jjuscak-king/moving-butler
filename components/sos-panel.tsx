"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { logMoveIssue } from "@/app/actions/issues";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { MoveIssueRow, MoveMemberRow } from "@/lib/database.types";
import {
  ISSUE_KIND_LABELS,
  ISSUE_KINDS,
  isIssueKind,
  type IssueKind,
} from "@/lib/sos";

function issueLabel(kind: string) {
  return isIssueKind(kind) ? ISSUE_KIND_LABELS[kind] : kind;
}

function memberEmail(userId: string, members: MoveMemberRow[]) {
  return members.find((member) => member.user_id === userId)?.email ?? "Household";
}

export function SosPanel({
  moveId,
  issues,
  members,
  sticky = false,
}: {
  moveId: string;
  issues: MoveIssueRow[];
  members: MoveMemberRow[];
  sticky?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<IssueKind>("crew_late");
  const [details, setDetails] = useState("");
  const [lastSteps, setLastSteps] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const result = await logMoveIssue(moveId, { kind, details });
      if (result.error || !result.issue) {
        toast.error(result.error ?? "Could not log that issue.");
        return;
      }
      setLastSteps(result.issue.next_steps);
      setDetails("");
      toast.success("Issue logged");
    });
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg leading-tight">Issue log</h3>
          <p className="text-sm text-muted-foreground">
            Log what broke. You get suggested next steps — no agent, just the
            playbook.
          </p>
        </div>
        <Button className="h-11" onClick={() => setOpen(true)}>
          Log an issue (SOS)
        </Button>
      </div>

      {issues.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No issues logged yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {issues.map((issue) => (
            <li key={issue.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-950">{issueLabel(issue.kind)}</p>
              <p className="mt-1 text-xs text-amber-950/70">
                {new Date(issue.created_at).toLocaleString("en-US", {
                  timeZone: "America/New_York",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" · "}
                {memberEmail(issue.created_by, members)}
              </p>
              {issue.details ? (
                <p className="mt-2 whitespace-pre-wrap">{issue.details}</p>
              ) : null}
              <p className="mt-2 text-amber-950/90">
                <span className="font-medium">Suggested next steps: </span>
                {issue.next_steps}
              </p>
            </li>
          ))}
        </ul>
      )}

      {sticky ? (
        <div className="sticky bottom-3 z-20">
          <Button className="h-12 w-full shadow-lg" onClick={() => setOpen(true)}>
            Log an issue (SOS)
          </Button>
        </div>
      ) : null}

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setLastSteps(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Log a move-day issue</SheetTitle>
            <SheetDescription>
              Pick what happened. We show a short next-steps playbook immediately.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 px-4">
            <Field label="What happened" htmlFor="sos-kind">
              <NativeSelect
                id="sos-kind"
                value={kind}
                onChange={(event) => {
                  if (isIssueKind(event.target.value)) setKind(event.target.value);
                }}
              >
                {ISSUE_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {ISSUE_KIND_LABELS[value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Details (optional)" htmlFor="sos-details">
              <Textarea
                id="sos-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Who you called, what the lobby said, confirmation #…"
              />
            </Field>
            {lastSteps ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-medium">Suggested next steps</p>
                <p className="mt-1">{lastSteps}</p>
              </div>
            ) : null}
          </div>
          <SheetFooter>
            <Button className="h-11" disabled={pending} onClick={submit}>
              {pending ? "Saving…" : lastSteps ? "Log another" : "Log issue"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
