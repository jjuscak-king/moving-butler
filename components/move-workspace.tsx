"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { updateStageStatus } from "@/app/actions/stages";
import { deleteTask, updateTaskStatus } from "@/app/actions/tasks";
import { AdminPacks } from "@/components/admin-packs";
import { BuildingNotesCard } from "@/components/building-notes-card";
import { DeleteMoveButton } from "@/components/delete-move-button";
import { NativeSelect } from "@/components/field";
import { HouseholdPanel } from "@/components/household-panel";
import { NycConstraintBanner } from "@/components/nyc-constraint-banner";
import { TaskCard } from "@/components/task-card";
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
  CASE_FILE_LABEL,
  CASE_FILE_LABEL_SHORT,
  HOME_SIZE_LABELS,
  SERVICE_MODE_LABELS,
  STAGE_KEYS,
  STAGE_META,
  STAGE_STATUS_LABELS,
  STAGE_STATUSES,
  type StageKey,
  type StageStatus,
  type TaskStatus,
} from "@/lib/constants";
import type {
  MoveInviteRow,
  MoveMemberRow,
  MoveRow,
  MoveStageRow,
  TaskRow,
} from "@/lib/database.types";
import { formatMoveWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

function isStageKey(value: string | undefined): value is StageKey {
  return !!value && STAGE_KEYS.includes(value as StageKey);
}

export function MoveWorkspace({
  move,
  stages,
  tasks,
  members,
  invites,
  currentUserId,
  isOwner,
  remindersEnabled,
  initialStage,
  initialPack,
}: {
  move: MoveRow;
  stages: MoveStageRow[];
  tasks: TaskRow[];
  members: MoveMemberRow[];
  invites: MoveInviteRow[];
  currentUserId: string;
  isOwner: boolean;
  remindersEnabled: boolean;
  initialStage?: string;
  initialPack?: string;
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
    const packQuery = key === "admin" && initialPack ? `&pack=${initialPack}` : "";
    router.replace(`/moves/${move.id}?stage=${key}${packQuery}`, { scroll: false });
  }

  function onStatus(taskId: string, status: TaskStatus) {
    startTransition(async () => {
      const result = await updateTaskStatus(move.id, taskId, status);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {CASE_FILE_LABEL}
            </p>
            <h1 className="font-heading text-3xl leading-tight">{move.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {BOROUGH_LABELS[move.from_borough]} → {BOROUGH_LABELS[move.to_borough]} ·{" "}
              {formatMoveWindow(move.window_start, move.window_end)}
            </p>
          </div>
          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <Button
                nativeButton={false}
                variant="outline"
                className="h-10"
                render={<Link href={`/moves/${move.id}/edit`} />}
              >
                Edit {CASE_FILE_LABEL_SHORT}
              </Button>
              <Button
                nativeButton={false}
                className="h-10"
                render={<Link href={`/moves/${move.id}/runbook`} />}
              >
                Move-day runbook
              </Button>
              <DeleteMoveButton moveId={move.id} label={move.label} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Co-mover</Badge>
              <Button
                nativeButton={false}
                className="h-10"
                render={<Link href={`/moves/${move.id}/runbook`} />}
              >
                Move-day runbook
              </Button>
            </div>
          )}
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
        {move.building_notes || move.budget_notes || move.key_contacts ? (
          <div className="grid gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            {move.building_notes ? (
              <p>
                <span className="font-medium">Building: </span>
                {move.building_notes}
              </p>
            ) : null}
            {move.key_contacts ? (
              <p className="whitespace-pre-wrap">
                <span className="font-medium">Key contacts: </span>
                {move.key_contacts}
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

      <NycConstraintBanner move={move} />

      <HouseholdPanel
        moveId={move.id}
        members={members}
        invites={invites}
        isOwner={isOwner}
        remindersEnabled={remindersEnabled}
      />

      <section className="grid gap-3">
        <div>
          <h2 className="font-heading text-xl">Journey stages</h2>
          <p className="text-sm text-muted-foreground">
            Customer Services path — Decide through Settle. Tap a stage to focus
            its checklist.
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
              Journey stage {focusedMeta.number}
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

        {selected === "admin" || selected === "move_day" ? (
          <BuildingNotesCard move={move} isOwner={isOwner} />
        ) : null}

        {selected === "move_day" ? (
          <div className="grid gap-3 rounded-xl border border-primary/20 bg-background p-4">
            <div>
              <h3 className="font-heading text-xl">Move-day runbook</h3>
              <p className="text-sm text-muted-foreground">
                Single phone screen: key contacts, access notes, payment reminder,
                and SOS issue log.
              </p>
            </div>
            <Button
              nativeButton={false}
              className="h-11 w-full sm:w-auto"
              render={<Link href={`/moves/${move.id}/runbook`} />}
            >
              Open phone runbook
            </Button>
          </div>
        ) : null}

        {selected === "admin" ? (
          <AdminPacks
            tasks={focusedTasks}
            allTasks={tasks}
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            pending={pending}
            highlightPack={initialPack}
            onAdd={() => {
              setEditing(null);
              setTaskOpen(true);
            }}
            onEdit={(task) => {
              setEditing(task);
              setTaskOpen(true);
            }}
            onDelete={isOwner ? setPendingDelete : undefined}
            onStatus={onStatus}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">
                {selected === "move_day" ? "Move-day checklist" : "Checklist"}
              </h3>
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
                  <TaskCard
                    key={task.id}
                    task={task}
                    tasks={tasks}
                    members={members}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    pending={pending}
                    onEdit={(row) => {
                      setEditing(row);
                      setTaskOpen(true);
                    }}
                    onDelete={isOwner ? setPendingDelete : undefined}
                    onStatus={onStatus}
                  />
                ))}
              </ul>
            )}
          </>
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
        allTasks={tasks}
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
