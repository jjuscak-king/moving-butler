"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createTask, updateTask } from "@/app/actions/tasks";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  STAGE_KEYS,
  STAGE_META,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type StageKey,
  type TaskStatus,
} from "@/lib/constants";
import type { TaskRow } from "@/lib/database.types";

export function TaskDialog({
  open,
  onOpenChange,
  moveId,
  defaultStage,
  task,
  allTasks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moveId: string;
  defaultStage: StageKey;
  task?: TaskRow | null;
  allTasks: TaskRow[];
}) {
  const [pending, setPending] = useState(false);
  const dependencyChoices = allTasks.filter((row) => row.id !== task?.id);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const payload = {
      title: String(formData.get("title") ?? ""),
      stage_key: String(formData.get("stage_key")) as StageKey,
      status: String(formData.get("status")) as TaskStatus,
      notes: String(formData.get("notes") ?? ""),
      is_optional: formData.get("is_optional") === "on",
      due_date: String(formData.get("due_date") ?? ""),
      depends_on_task_id: String(formData.get("depends_on_task_id") ?? ""),
    };
    const result = task
      ? await updateTask(moveId, task.id, payload)
      : await createTask(moveId, payload);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(task ? "Task saved" : "Task added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" key={task?.id ?? "new"}>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            Optional due date and a simple dependency. Incomplete dependencies show a
            “Blocked by” warning — not a hard lock.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <Field label="Title" htmlFor="task-title">
            <Input
              id="task-title"
              name="title"
              required
              className="h-11"
              defaultValue={task?.title}
              placeholder="Call building management"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage" htmlFor="task-stage">
              <NativeSelect
                id="task-stage"
                name="stage_key"
                defaultValue={task?.stage_key ?? defaultStage}
              >
                {STAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {STAGE_META[key].number}. {STAGE_META[key].label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status" htmlFor="task-status">
              <NativeSelect
                id="task-status"
                name="status"
                defaultValue={task?.status ?? "todo"}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Due date"
              htmlFor="task-due"
              hint="Date only (UTC calendar date). Shown in New York time."
            >
              <Input
                id="task-due"
                name="due_date"
                type="date"
                className="h-11"
                defaultValue={task?.due_date ?? ""}
              />
            </Field>
            <Field
              label="Blocked by"
              htmlFor="task-depends"
              hint="Soft-block warning until that task is done."
            >
              <NativeSelect
                id="task-depends"
                name="depends_on_task_id"
                defaultValue={task?.depends_on_task_id ?? "none"}
              >
                <option value="none">None</option>
                {dependencyChoices.map((row) => (
                  <option key={row.id} value={row.id}>
                    {STAGE_META[row.stage_key].label}: {row.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Notes (optional)" htmlFor="task-notes">
            <Textarea
              id="task-notes"
              name="notes"
              defaultValue={task?.notes ?? ""}
              placeholder="Phone numbers, hours, confirmation #…"
            />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="is_optional"
              defaultChecked={task?.is_optional}
              className="size-4 accent-primary"
            />
            Mark as optional
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10" disabled={pending}>
              {pending ? "Saving…" : "Save task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
