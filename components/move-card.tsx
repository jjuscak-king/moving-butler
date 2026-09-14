import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ACCESS_LABELS,
  BOROUGH_LABELS,
  HOME_SIZE_LABELS,
  SERVICE_MODE_LABELS,
} from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";
import { formatMoveWindow } from "@/lib/format";

export function MoveCard({
  move,
  shared = false,
}: {
  move: MoveRow;
  shared?: boolean;
}) {
  return (
    <Link href={`/moves/${move.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg">{move.label}</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-1">
                <span>{BOROUGH_LABELS[move.from_borough]}</span>
                <ArrowRight className="size-3.5" />
                <span>{BOROUGH_LABELS[move.to_borough]}</span>
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="outline">{HOME_SIZE_LABELS[move.home_size]}</Badge>
              {shared ? <Badge variant="secondary">Shared</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>{formatMoveWindow(move.window_start, move.window_end)}</p>
          <p>
            {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}
            {move.coi_required ? " · COI required" : ""}
          </p>
          <p>{SERVICE_MODE_LABELS[move.service_mode]}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
