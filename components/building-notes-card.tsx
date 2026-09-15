import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";

export function BuildingNotesCard({
  move,
  isOwner,
  compact = false,
}: {
  move: MoveRow;
  isOwner: boolean;
  compact?: boolean;
}) {
  return (
    <section className="grid gap-2 rounded-xl border border-border bg-background p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg leading-tight">Building / management notes</h3>
          {!compact ? (
            <p className="text-xs text-muted-foreground">
              Access rules for Admin and Move day. Edit lives on the {CASE_FILE_LABEL_SHORT}.
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
      {move.building_notes ? (
        <p className="whitespace-pre-wrap">{move.building_notes}</p>
      ) : (
        <p className="text-muted-foreground">
          {isOwner
            ? "Add super, freight hours, walk-up flights, and COI email so they are here on move morning."
            : `Ask the owner to add building notes on this ${CASE_FILE_LABEL_SHORT}.`}
        </p>
      )}
    </section>
  );
}
