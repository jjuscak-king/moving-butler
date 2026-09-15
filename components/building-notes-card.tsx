import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";
import { contactDisplayLines } from "@/lib/sos";

function Note({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-medium">{label}: </span>
      <span className="whitespace-pre-wrap">{value}</span>
    </p>
  );
}

export function BuildingNotesCard({
  move,
  isOwner,
  compact = false,
}: {
  move: MoveRow;
  isOwner: boolean;
  compact?: boolean;
}) {
  const phone = contactDisplayLines(move.mgmt_phone)[0];
  const hasStructured =
    move.mgmt_name ||
    move.mgmt_phone ||
    move.elevator_window_notes ||
    move.loading_dock_notes ||
    move.coi_status_notes ||
    move.building_notes;

  return (
    <section className="grid gap-2 rounded-xl border border-border bg-background p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg leading-tight">Building / management notes</h3>
          {!compact ? (
            <p className="text-xs text-muted-foreground">
              {isOwner
                ? `Owner can edit these on the ${CASE_FILE_LABEL_SHORT}. Co-movers see them on Move day.`
                : "View only — the owner edits these on the Case File."}
            </p>
          ) : null}
        </div>
        {isOwner ? (
          <Button
            nativeButton={false}
            variant="outline"
            className="h-10"
            render={<Link href={`/moves/${move.id}/edit`} />}
          >
            Edit notes
          </Button>
        ) : null}
      </div>
      {hasStructured ? (
        <div className="grid gap-2">
          {move.mgmt_name ? (
            <p>
              <span className="font-medium">Management: </span>
              {move.mgmt_name}
            </p>
          ) : null}
          {phone ? (
            phone.tel ? (
              <a
                href={phone.tel}
                className="flex min-h-11 items-center font-medium underline-offset-4 hover:underline"
              >
                {move.mgmt_phone}
              </a>
            ) : (
              <p>
                <span className="font-medium">Phone: </span>
                {move.mgmt_phone}
              </p>
            )
          ) : null}
          <Note label="Elevator window" value={move.elevator_window_notes} />
          <Note label="Loading dock" value={move.loading_dock_notes} />
          <Note label="COI status" value={move.coi_status_notes} />
          <Note label="Building notes" value={move.building_notes} />
        </div>
      ) : (
        <p className="text-muted-foreground">
          {isOwner
            ? "Add management name, phone, elevator window, dock, and COI status so they are here on move morning."
            : `Ask the owner to add building notes on this ${CASE_FILE_LABEL_SHORT}.`}
        </p>
      )}
    </section>
  );
}
