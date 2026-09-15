"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { claimTask, unclaimTask } from "@/app/actions/tasks";
import { NativeSelect } from "@/components/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/constants";
import type { MoveMemberRow, TaskRow } from "@/lib/database.types";
import { formatMoveDate } from "@/lib/format";
import {
  dependencyTitle,
  isDueToday,
  isTaskOverdue,
  isTaskSoftBlocked,
} from "@/lib/task-state";
import { cn } from "@/lib/utils";

function memberLabel(userId: string | null, members: MoveMemberRow[]) {
  if (!userId) return null;
  return members.find((member) => member.user_id === userId)?.email ?? "Co-mover";
}

export function TaskCard({
  task,
  tasks,
  members,
  currentUserId,
  isOwner,
  pending,
  showQuickStatus = false,
  onEdit,
  onDelete,
  onStatus,
}: {
  task: TaskRow;
  tasks: TaskRow[];
  members: MoveMemberRow[];
  currentUserId: string;
  isOwner: boolean;
  pending?: boolean;
  showQuickStatus?: boolean;
  onEdit: (task: TaskRow) => void;
  onDelete?: (task: TaskRow) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
}) {
  const [claimPending, startClaim] = useTransition();
  const waitingOn = isTaskSoftBlocked(task.depends_on_task_id, tasks);
  const overdue = isTaskOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date, task.status);
  const claimedLabel = memberLabel(task.claimed_by, members);
  const claimedByMe = task.claimed_by === currentUserId;
  const busy = pending || claimPending;

  return (
    <li
      id={`task-${task.id}`}
      className={cn(
        "rounded-xl border bg-background p-3",
        (task.status === "blocked" || waitingOn) &&
          "border-amber-400 bg-amber-50 shadow-[inset_4px_0_0_0_rgb(245_158_11)]",
        task.status === "done" && "border-emerald-300 bg-emerald-50/70 shadow-[inset_4px_0_0_0_rgb(5_150_105)]",
        overdue && task.status !== "done" && "border-destructive/40"
      )}
    >
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium leading-snug">{task.title}</p>
            {task.notes ? (
              <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p>
            ) : null}
            {waitingOn ? (
              <p className="mt-1 text-sm text-amber-800">
                Blocked by “{dependencyTitle(task.depends_on_task_id, tasks) ?? "another task"}”
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {task.due_date ? `Due ${formatMoveDate(task.due_date)}` : "No due date"}
              {claimedLabel ? ` · Claimed by ${claimedByMe ? "you" : claimedLabel}` : " · Unclaimed"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {task.is_optional ? <Badge variant="outline">Optional</Badge> : null}
            {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
            {dueToday ? <Badge variant="secondary">Due today</Badge> : null}
            {task.status === "done" ? <Badge className="bg-emerald-700 text-white">Done</Badge> : null}
            {task.status === "blocked" ? (
              <Badge className="border-amber-400 bg-amber-200 text-amber-950">Blocked</Badge>
            ) : null}
          </div>
        </div>
        {showQuickStatus ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              className={cn(
                "h-11",
                task.status === "done"
                  ? "bg-emerald-700 text-white hover:bg-emerald-700/90"
                  : ""
              )}
              variant={task.status === "done" ? "default" : "outline"}
              disabled={busy}
              onClick={() => onStatus(task.id, "done")}
            >
              Done
            </Button>
            <Button
              className={cn(
                "h-11",
                task.status === "blocked" &&
                  "border-amber-500 bg-amber-500 text-amber-950 hover:bg-amber-500/90"
              )}
              variant={task.status === "blocked" ? "default" : "outline"}
              disabled={busy}
              onClick={() => onStatus(task.id, "blocked")}
            >
              Blocked
            </Button>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <NativeSelect
            aria-label={`Status for ${task.title}`}
            value={task.status}
            className="sm:max-w-44"
            disabled={busy}
            onChange={(event) => {
              const status = event.target.value as TaskStatus;
              if (!TASK_STATUSES.includes(status)) return;
              onStatus(task.id, status);
            }}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
          <div className="flex flex-wrap gap-2">
            {claimedByMe ? (
              <Button
                variant="outline"
                className="h-11 flex-1 sm:h-10 sm:flex-none"
                disabled={busy}
                onClick={() => {
                  startClaim(async () => {
                    const result = await unclaimTask(task.move_id, task.id);
                    if (result.error) toast.error(result.error);
                  });
                }}
              >
                Release
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-11 flex-1 sm:h-10 sm:flex-none"
                disabled={busy}
                onClick={() => {
                  startClaim(async () => {
                    const result = await claimTask(task.move_id, task.id);
                    if (result.error) toast.error(result.error);
                    else toast.success("Task claimed");
                  });
                }}
              >
                Claim
              </Button>
            )}
            <Button
              variant="outline"
              className="h-11 flex-1 sm:h-10 sm:flex-none"
              onClick={() => onEdit(task)}
            >
              Edit
            </Button>
            {isOwner && onDelete ? (
              <Button
                variant="destructive"
                className="h-11 flex-1 sm:h-10 sm:flex-none"
                onClick={() => onDelete(task)}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
