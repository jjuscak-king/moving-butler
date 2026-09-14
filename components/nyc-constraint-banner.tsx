import { ACCESS_LABELS, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";

export function NycConstraintBanner({ move }: { move: MoveRow }) {
  return (
    <aside className="grid gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <p className="font-medium text-amber-950">NYC constraint pack</p>
      <p className="text-amber-950/80">
        This {CASE_FILE_LABEL_SHORT} always includes Admin tasks for <strong>COI</strong>,{" "}
        <strong>elevator</strong>, <strong>loading dock</strong>, and <strong>parking</strong>.
        Move-day work shows a “Blocked by” warning on the COI task until that is done — it is a
        warning, not a hard lock. {move.coi_required ? "COI required" : "COI not marked"} ·{" "}
        {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}.
      </p>
    </aside>
  );
}
