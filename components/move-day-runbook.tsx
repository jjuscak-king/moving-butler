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
}: {
  move: MoveRow;
  members: MoveMemberRow[];
  issues: MoveIssueRow[];
  isOwner: boolean;
}) {
  const phone = contactDisplayLines(move.mgmt_phone)[0];

  return (
    <div className="mx-auto grid w-full max-w-[375px] gap-4">
      <header className="grid gap-2">
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
      </header>

      <section className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg leading-tight">Contacts</h3>
            <p className="text-xs text-muted-foreground">Tap the number to call.</p>
          </div>
          {isOwner ? (
            <Button
              nativeButton={false}
              variant="outline"
              className="h-10"
              render={<Link href={`/moves/${move.id}/edit`} />}
            >
              Edit
            </Button>
          ) : (
            <Badge variant="secondary">View only</Badge>
          )}
        </div>
        {move.mgmt_name || move.mgmt_phone ? (
          <div className="grid gap-1">
            {move.mgmt_name ? <p className="font-medium">{move.mgmt_name}</p> : null}
            {phone?.tel ? (
              <a
                href={phone.tel}
                className="flex min-h-11 items-center rounded-lg border bg-background px-3 py-2 font-medium underline-offset-4 hover:underline"
              >
                {move.mgmt_phone}
              </a>
            ) : move.mgmt_phone ? (
              <p>{move.mgmt_phone}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {isOwner
              ? "Add management name and phone on the Case File."
              : "No management contact yet."}
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

      <section className="grid gap-2 rounded-xl border bg-card p-4 text-sm">
        <h3 className="font-heading text-lg leading-tight">Access notes</h3>
        <p>
          {move.from_address} ({BOROUGH_LABELS[move.from_borough]}) → {move.to_address} (
          {BOROUGH_LABELS[move.to_borough]})
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}
          </Badge>
          <Badge variant={move.coi_required ? "default" : "outline"}>
            {move.coi_required ? "COI required" : "COI not marked"}
          </Badge>
        </div>
        <BuildingNotesCard move={move} isOwner={isOwner} compact />
      </section>

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

      <SosPanel moveId={move.id} issues={issues} members={members} sticky />
    </div>
  );
}
