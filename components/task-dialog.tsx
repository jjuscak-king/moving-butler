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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moveId: string;
  defaultStage: StageKey;
  task?: TaskRow | null;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const payload = {
      title: String(formData.get("title") ?? ""),
      stage_key: String(formData.get("stage_key")) as StageKey,
      status: String(formData.get("status")) as TaskStatus,
      notes: String(formData.get("notes") ?? ""),
      is_optional: formData.get("is_optional") === "on",
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
            Tasks live on a specialist workstream. Status is manual in Week 1.
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
