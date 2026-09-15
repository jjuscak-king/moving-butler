import Link from "next/link";

import { BuildingNotesCard } from "@/components/building-notes-card";
import { SosPanel } from "@/components/sos-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ACCESS_LABELS,
  BOROUGH_LABELS,
  CASE_FILE_LABEL,
  CASE_FILE_LABEL_SHORT,
} from "@/lib/constants";
import type { MoveIssueRow, MoveMemberRow, MoveRow } from "@/lib/database.types";
import { formatMoveWindow } from "@/lib/format";
import { contactDisplayLines, MOVE_DAY_PAYMENT_REMINDER } from "@/lib/sos";

export function MoveDayRunbook({
  move,
  members,
  issues,
  isOwner,
  embedded = false,
}: {
  move: MoveRow;
  members: MoveMemberRow[];
  issues: MoveIssueRow[];
  isOwner: boolean;
  embedded?: boolean;
}) {
  const contacts = contactDisplayLines(move.key_contacts);

  return (
    <div className="mx-auto grid w-full max-w-lg gap-4">
      <header className="grid gap-2">
        {embedded ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-xl">Move-day runbook</h3>
            <Button
              nativeButton={false}
              className="h-11"
              render={<Link href={`/moves/${move.id}/runbook`} />}
            >
              Open phone runbook
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Move-day runbook
            </p>
            <h1 className="font-heading text-3xl leading-tight">{move.label}</h1>
            <p className="text-sm text-muted-foreground">
              {CASE_FILE_LABEL} · {formatMoveWindow(move.window_start, move.window_end)}
            </p>
            <Button
              nativeButton={false}
              variant="outline"
              className="h-10 w-fit"
              render={<Link href={`/moves/${move.id}?stage=move_day`} />}
            >
              Back to {CASE_FILE_LABEL_SHORT}
            </Button>
          </>
        )}
      </header>

      <section className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
        <h3 className="font-heading text-lg leading-tight">Addresses</h3>
        <p>
          <span className="font-medium">From: </span>
          {move.from_address} ({BOROUGH_LABELS[move.from_borough]})
        </p>
        <p>
          <span className="font-medium">To: </span>
          {move.to_address} ({BOROUGH_LABELS[move.to_borough]})
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary">
            {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}
          </Badge>
          <Badge variant={move.coi_required ? "default" : "outline"}>
            {move.coi_required ? "COI required" : "COI not marked"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg leading-tight">Key contacts</h3>
            <p className="text-xs text-muted-foreground">Tap a number to call.</p>
          </div>
          {isOwner ? (
            <Button
              nativeButton={false}
              variant="outline"
              className="h-10"
              render={<Link href={`/moves/${move.id}/edit`} />}
            >
              Edit contacts
            </Button>
          ) : null}
        </div>
        {contacts.length ? (
          <ul className="grid gap-2">
            {contacts.map((contact) => (
              <li key={contact.line}>
                {contact.tel ? (
                  <a
                    href={contact.tel}
                    className="flex min-h-11 items-center rounded-lg border bg-background px-3 py-2 font-medium underline-offset-4 hover:underline"
                  >
                    {contact.line}
                  </a>
                ) : (
                  <p className="rounded-lg border bg-background px-3 py-2">{contact.line}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {isOwner
              ? "Add super, management, and crew numbers on the Case File so they are one tap away."
              : "No key contacts yet."}
          </p>
        )}
        <ul className="grid gap-1 text-muted-foreground">
          {members.map((member) => (
            <li key={member.id}>
              Household: {member.email || "Signed-in member"}
              {member.role === "owner" ? " (owner)" : " (co-mover)"}
            </li>
          ))}
        </ul>
      </section>

      <BuildingNotesCard move={move} isOwner={isOwner} compact />

      <section className="grid gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <h3 className="font-heading text-lg leading-tight">Payment reminder</h3>
        <p>{MOVE_DAY_PAYMENT_REMINDER}</p>
        {move.budget_notes ? (
          <p>
            <span className="font-medium">Budget notes: </span>
            {move.budget_notes}
          </p>
        ) : null}
      </section>

      <SosPanel moveId={move.id} issues={issues} members={members} sticky={!embedded} />
    </div>
  );
}
