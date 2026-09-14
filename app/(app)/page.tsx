import Link from "next/link";

import { MoveCard } from "@/components/move-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Your moves",
};

export default async function MovesPage() {
  const { supabase } = await requireUser();
  const { data: moves, error } = await supabase
    .from("moves")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load moves: {error.message}
      </div>
    );
  }

  if (!moves?.length) {
    return (
      <section className="mx-auto flex max-w-lg flex-col items-start gap-4 py-10">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Customer & outcome
        </p>
        <h1 className="font-heading text-4xl leading-tight">No moves yet</h1>
        <p className="text-muted-foreground">
          Start with an NYC move profile. We&apos;ll seed the six-stage timeline
          and checklist so you can orchestrate the relocation — not bid it out.
        </p>
        <Link
          href="/moves/new"
          className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
        >
          Create your first move
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Your moves
          </p>
          <h1 className="font-heading text-3xl">Move list</h1>
        </div>
        <Link href="/moves/new" className={cn(buttonVariants(), "h-10 px-3")}>
          New move
        </Link>
      </div>
      <div className="grid gap-3">
        {moves.map((move) => (
          <MoveCard key={move.id} move={move} />
        ))}
      </div>
    </section>
  );
}
