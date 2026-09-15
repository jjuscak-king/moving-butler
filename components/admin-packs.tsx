"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";

import { TaskCard } from "@/components/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PACKS,
  isAdminPackKey,
  packKeyForTask,
  packProgress,
} from "@/lib/admin-packs";
import type { TaskStatus } from "@/lib/constants";
import type { MoveMemberRow, TaskRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function AdminPacks({
  tasks,
  allTasks,
  members,
  currentUserId,
  isOwner,
  pending,
  highlightPack,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  tasks: TaskRow[];
  allTasks: TaskRow[];
  members: MoveMemberRow[];
  currentUserId: string;
  isOwner: boolean;
  pending?: boolean;
  highlightPack?: string;
  onAdd: () => void;
  onEdit: (task: TaskRow) => void;
  onDelete?: (task: TaskRow) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
}) {
  const activePack = isAdminPackKey(highlightPack) ? highlightPack : null;

  useEffect(() => {
    if (!activePack) return;
    const node = document.getElementById(`pack-${activePack}`);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activePack]);

  const grouped = ADMIN_PACKS.map((pack) => ({
    pack,
    tasks: tasks
      .filter((task) => packKeyForTask(task) === pack.key)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
  }));

  const other = tasks
    .filter((task) => !packKeyForTask(task))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Admin packs</h3>
          <p className="text-sm text-muted-foreground">
            NYC-oriented work grouped so Done and Blocked stay obvious. Curated
            links are official — this is not a marketplace.
          </p>
        </div>
        <Button className="h-10" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add task
        </Button>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {grouped.map(({ pack, tasks: packTasks }) => {
          const progress = packProgress(packTasks);
          return (
            <a
              key={pack.key}
              href={`#pack-${pack.key}`}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                activePack === pack.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              )}
            >
              {pack.label}
              {progress.total ? ` · ${progress.done}/${progress.total}` : ""}
            </a>
          );
        })}
      </div>

      {grouped.map(({ pack, tasks: packTasks }) => {
        const progress = packProgress(packTasks);
        const highlighted = activePack === pack.key;
        return (
          <section
            key={pack.key}
            id={`pack-${pack.key}`}
            className={cn(
              "grid scroll-mt-20 gap-3 rounded-xl border p-3 sm:p-4",
              highlighted ? "border-primary ring-2 ring-primary/30" : "border-border"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-heading text-lg leading-tight">{pack.label}</h4>
                <p className="text-sm text-muted-foreground">{pack.blurb}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                {progress.total ? (
                  <Badge variant="secondary">
                    {progress.done}/{progress.total} done
                  </Badge>
                ) : null}
                {progress.blocked ? (
                  <Badge className="border-amber-400 bg-amber-200 text-amber-950">
                    {progress.blocked} blocked
                  </Badge>
                ) : null}
              </div>
            </div>
            {pack.links.length ? (
              <ul className="flex flex-wrap gap-2">
                {pack.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-3 text-sm underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {packTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks in this pack yet.</p>
            ) : (
              <ul className="grid gap-2">
                {packTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    tasks={allTasks}
                    members={members}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    pending={pending}
                    showQuickStatus
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatus={onStatus}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {other.length ? (
        <section className="grid gap-3 rounded-xl border border-dashed p-3 sm:p-4">
          <h4 className="font-heading text-lg">Other Admin</h4>
          <ul className="grid gap-2">
            {other.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                tasks={allTasks}
                members={members}
                currentUserId={currentUserId}
                isOwner={isOwner}
                pending={pending}
                showQuickStatus
                onEdit={onEdit}
                onDelete={onDelete}
                onStatus={onStatus}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
