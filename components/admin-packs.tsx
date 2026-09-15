"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { TaskCard } from "@/components/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PACK_DISCLAIMER,
  ADMIN_PACKS,
  adminPackForTask,
  isAdminPackKey,
  packProgress,
  type AdminPackKey,
} from "@/lib/admin-packs";
import type { TaskStatus } from "@/lib/constants";
import type { MoveMemberRow, TaskRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function AdminPacks({
  moveId,
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
  moveId: string;
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
  const router = useRouter();
  const activePack = isAdminPackKey(highlightPack) ? highlightPack : null;

  function openPack(key: AdminPackKey | null) {
    const query = key ? `?stage=admin&pack=${key}` : "?stage=admin";
    router.replace(`/moves/${moveId}${query}`, { scroll: false });
  }

  const grouped = ADMIN_PACKS.map((pack) => ({
    pack,
    tasks: tasks
      .filter((task) => adminPackForTask(task) === pack.key)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
  }));

  const other = tasks
    .filter((task) => !adminPackForTask(task))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  const detail = grouped.find(({ pack }) => pack.key === activePack);
  const detailProgress = detail ? packProgress(detail.tasks) : null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Admin packs</h3>
          <p className="text-sm text-muted-foreground">
            Five NYC packs. Open a pack to mark tasks Done or Blocked.
          </p>
        </div>
        <Button className="h-10" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add task
        </Button>
      </div>

      {detail && detailProgress ? (
        <section className="grid gap-3 rounded-xl border border-border p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Button variant="ghost" className="mb-1 h-10 px-2" onClick={() => openPack(null)}>
                <ArrowLeft data-icon="inline-start" />
                Back to packs
              </Button>
              <h4 className="font-heading text-xl leading-tight">{detail.pack.label}</h4>
              <p className="text-sm text-muted-foreground">{detail.pack.blurb}</p>
            </div>
            <Badge variant="secondary">
              {detailProgress.done}/{detailProgress.total} done
            </Badge>
          </div>
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {ADMIN_PACK_DISCLAIMER}
          </p>
          {detail.pack.links.length ? (
            <ul className="flex flex-wrap gap-2">
              {detail.pack.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-3 text-sm underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {detail.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks in this pack yet.</p>
          ) : (
            <ul className="grid gap-2">
              {detail.tasks.map((task) => (
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
      ) : (
        <>
          <div className="grid gap-2">
            {grouped.map(({ pack, tasks: packTasks }) => {
              const progress = packProgress(packTasks);
              return (
                <button
                  key={pack.key}
                  type="button"
                  onClick={() => openPack(pack.key)}
                  className={cn(
                    "flex min-h-14 items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-left",
                    progress.blocked && "border-amber-400 bg-amber-50"
                  )}
                >
                  <span>
                    <span className="font-heading text-lg leading-tight">{pack.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{pack.blurb}</span>
                  </span>
                  <Badge variant="secondary">
                    {progress.done}/{progress.total} done
                  </Badge>
                </button>
              );
            })}
          </div>
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
        </>
      )}
    </div>
  );
}
