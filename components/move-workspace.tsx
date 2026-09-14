"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { updateStageStatus } from "@/app/actions/stages";
import { deleteTask, updateTaskStatus } from "@/app/actions/tasks";
import { DeleteMoveButton } from "@/components/delete-move-button";
import { NativeSelect } from "@/components/field";
import { TaskDialog } from "@/components/task-dialog";
import { Badge } from "@/components/ui/badge";
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
  ACCESS_LABELS,
  BOROUGH_LABELS,
  HOME_SIZE_LABELS,
  SERVICE_MODE_LABELS,
  STAGE_KEYS,
  STAGE_META,
  STAGE_STATUS_LABELS,
  STAGE_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type StageKey,
  type StageStatus,
  type TaskStatus,
} from "@/lib/constants";
import type { MoveRow, MoveStageRow, TaskRow } from "@/lib/database.types";
import { formatMoveWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

function isStageKey(value: string | undefined): value is StageKey {
  return !!value && STAGE_KEYS.includes(value as StageKey);
}

export function MoveWorkspace({
  move,
  stages,
  tasks,
  initialStage,
}: {
  move: MoveRow;
  stages: MoveStageRow[];
  tasks: TaskRow[];
  initialStage?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<StageKey>(
    isStageKey(initialStage) ? initialStage : "decide"
  );
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskRow | null>(null);
  const [pending, startTransition] = useTransition();

  const stageByKey = useMemo(() => {
    return Object.fromEntries(stages.map((stage) => [stage.stage_key, stage])) as Record<
      StageKey,
      MoveStageRow | undefined
    >;
  }, [stages]);

  const focusedTasks = tasks
    .filter((task) => task.stage_key === selected)
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  const focusedMeta = STAGE_META[selected];
  const focusedStage = stageByKey[selected];

  function focusStage(key: StageKey) {
    setSelected(key);
    router.replace(`/moves/${move.id}?stage=${key}`, { scroll: false });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Move profile
            </p>
            <h1 className="font-heading text-3xl leading-tight">{move.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {BOROUGH_LABELS[move.from_borough]} → {BOROUGH_LABELS[move.to_borough]} ·{" "}
              {formatMoveWindow(move.window_start, move.window_end)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              className="h-10"
              render={<Link href={`/moves/${move.id}/edit`} />}
            >
              Edit profile
            </Button>
            <DeleteMoveButton moveId={move.id} label={move.label} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{HOME_SIZE_LABELS[move.home_size]}</Badge>
          <Badge variant="secondary">
            {ACCESS_LABELS[move.access_from]} → {ACCESS_LABELS[move.access_to]}
          </Badge>
          <Badge variant="secondary">{SERVICE_MODE_LABELS[move.service_mode]}</Badge>
          <Badge variant={move.coi_required ? "default" : "outline"}>
            {move.coi_required ? "COI required" : "COI not marked"}
          </Badge>
        </div>
        {move.building_notes || move.budget_notes ? (
          <div className="grid gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            {move.building_notes ? (
              <p>
                <span className="font-medium">Building: </span>
                {move.building_notes}
              </p>
            ) : null}
            {move.budget_notes ? (
              <p>
                <span className="font-medium">Budget: </span>
                {move.budget_notes}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="font-heading text-xl">Six-stage timeline</h2>
          <p className="text-sm text-muted-foreground">
            Fixed order. Status is set by you. Tap a stage to focus its checklist.
          </p>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:px-0">
          {STAGE_KEYS.map((key) => {
            const meta = STAGE_META[key];
            const status = stageByKey[key]?.status ?? "not_started";
            const count = tasks.filter((task) => task.stage_key === key).length;
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => focusStage(key)}
                className={cn(
                  "min-w-[9.75rem] snap-start rounded-xl px-3 py-3 text-left ring-1 transition-colors",
                  active
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-card-foreground ring-foreground/10",
                  !active && status === "blocked" && "bg-amber-50 ring-amber-400"
                )}
              >
                <p className={cn("text-[11px] font-medium", active ? "opacity-80" : "text-muted-foreground")}>
                  {meta.number} / 6
                </p>
                <p className="font-heading text-lg leading-tight">{meta.label}</p>
                <p className={cn("mt-1 text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                  {STAGE_STATUS_LABELS[status]} · {count}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section
        id={`stage-${selected}`}
        className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Workstream {focusedMeta.number}
            </p>
            <h2 className="font-heading text-2xl">{focusedMeta.label}</h2>
            <p className="text-sm text-muted-foreground">{focusedMeta.blurb}</p>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-48">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="stage-status">
              Stage status
            </label>
            <NativeSelect
              id="stage-status"
              value={focusedStage?.status ?? "not_started"}
              disabled={pending}
              onChange={(event) => {
                const status = event.target.value as StageStatus;
                if (!STAGE_STATUSES.includes(status)) return;
                startTransition(async () => {
                  const result = await updateStageStatus(move.id, selected, status);
                  if (result.error) toast.error(result.error);
                });
              }}
            >
              {STAGE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STAGE_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Checklist</h3>
          <Button
            className="h-10"
            onClick={() => {
              setEditing(null);
              setTaskOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            Add task
          </Button>
        </div>

        {focusedTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
            No tasks in this stage yet.
          </p>
        ) : (
          <ul className="grid gap-2">
            {focusedTasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  "rounded-xl border bg-background p-3",
                  task.status === "blocked" &&
                    "border-amber-400 bg-amber-50 shadow-[inset_4px_0_0_0_rgb(245_158_11)]"
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{task.title}</p>
                      {task.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p>
                      ) : null}
                    </div>
                    {task.is_optional ? <Badge variant="outline">Optional</Badge> : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <NativeSelect
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      className="sm:max-w-44"
                      onChange={(event) => {
                        const status = event.target.value as TaskStatus;
                        if (!TASK_STATUSES.includes(status)) return;
                        startTransition(async () => {
                          const result = await updateTaskStatus(move.id, task.id, status);
                          if (result.error) toast.error(result.error);
                        });
                      }}
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TASK_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </NativeSelect>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="h-11 flex-1 sm:h-10 sm:flex-none"
                        onClick={() => {
                          setEditing(task);
                          setTaskOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 flex-1 sm:h-10 sm:flex-none"
                        onClick={() => setPendingDelete(task)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TaskDialog
        open={taskOpen}
        onOpenChange={(open) => {
          setTaskOpen(open);
          if (!open) setEditing(null);
        }}
        moveId={move.id}
        defaultStage={selected}
        task={editing}
      />

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `“${pendingDelete.title}” will be removed from ${STAGE_META[pendingDelete.stage_key].label}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10"
              disabled={pending}
              onClick={() => {
                if (!pendingDelete) return;
                startTransition(async () => {
                  const result = await deleteTask(move.id, pendingDelete.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Task deleted");
                  setPendingDelete(null);
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
