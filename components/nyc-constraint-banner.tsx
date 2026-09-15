import Link from "next/link";

import { ACCESS_LABELS, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";

const CHIPS = [
  { label: "COI", pack: "building" },
  { label: "elevator", pack: "building" },
  { label: "loading dock", pack: "building" },
  { label: "parking", pack: "building" },
] as const;

export function NycConstraintBanner({ move }: { move: MoveRow }) {
  return (
    <aside className="grid gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <p className="font-medium text-amber-950">NYC constraint pack</p>
      <p className="text-amber-950/80">
        This {CASE_FILE_LABEL_SHORT} always includes Admin tasks for COI, elevator,
        loading dock, and parking. Move-day work shows a “Blocked by” warning on the
        COI task until that is done — it is a warning, not a hard lock.{" "}
        {move.coi_required ? "COI required" : "COI not marked"} ·{" "}
        {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}.
      </p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={`/moves/${move.id}?stage=admin&pack=${chip.pack}`}
            className="inline-flex h-10 items-center rounded-full border border-amber-400 bg-white px-3 text-xs font-medium text-amber-950"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
