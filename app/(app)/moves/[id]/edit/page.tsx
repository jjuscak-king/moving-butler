import { notFound, redirect } from "next/navigation";

import { MoveForm } from "@/components/move-form";
import { requireUser } from "@/lib/auth";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";

export const metadata = {
  title: `Edit ${CASE_FILE_LABEL_SHORT}`,
};

export default async function EditMovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: move } = await supabase.from("moves").select("*").eq("id", id).maybeSingle();

  if (!move) notFound();
  if (move.user_id !== user.id) {
    redirect(`/moves/${id}`);
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {CASE_FILE_LABEL}
        </p>
        <h1 className="font-heading text-3xl">Edit {move.label}</h1>
      </div>
      <MoveForm move={move} />
    </section>
  );
}
