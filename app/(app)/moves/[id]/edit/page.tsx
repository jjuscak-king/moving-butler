import { notFound } from "next/navigation";

import { MoveForm } from "@/components/move-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Edit move",
};

export default async function EditMovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: move } = await supabase.from("moves").select("*").eq("id", id).maybeSingle();

  if (!move) notFound();

  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          NYC move profile
        </p>
        <h1 className="font-heading text-3xl">Edit {move.label}</h1>
      </div>
      <MoveForm move={move} />
    </section>
  );
}
