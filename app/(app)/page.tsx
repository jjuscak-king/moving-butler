import Link from "next/link";

import { MoveCard } from "@/components/move-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import { getSupabaseEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Case Files",
};

export default async function MovesPage() {
  if (!getSupabaseEnv()) {
    return null;
  }

  const { supabase, user } = await requireUser();
  const { data: moves, error } = await supabase
    .from("moves")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load Case Files: {error.message}
      </div>
    );
  }

  if (!moves?.length) {
    return (
      <section className="mx-auto flex max-w-lg flex-col items-start gap-4 py-10">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {CASE_FILE_LABEL}
        </p>
        <h1 className="font-heading text-4xl leading-tight">No Case File yet</h1>
        <p className="text-muted-foreground">
          Open a {CASE_FILE_LABEL} to orchestrate an NYC relocation. We&apos;ll seed
          the six journey stages and checklist — this is software, not a moving
          company.
        </p>
        <Link
          href="/moves/new"
          className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
        >
          Create your first {CASE_FILE_LABEL_SHORT}
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {CASE_FILE_LABEL_SHORT}s
          </p>
          <h1 className="font-heading text-3xl">Your {CASE_FILE_LABEL}s</h1>
        </div>
        <Link href="/moves/new" className={cn(buttonVariants(), "h-10 px-3")}>
          New {CASE_FILE_LABEL_SHORT}
        </Link>
      </div>
      <div className="grid gap-3">
        {moves.map((move) => (
          <MoveCard key={move.id} move={move} shared={move.user_id !== user.id} />
        ))}
      </div>
    </section>
  );
}
