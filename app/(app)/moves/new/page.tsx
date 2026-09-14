import { MoveForm } from "@/components/move-form";

export const metadata = {
  title: "New move",
};

export default function NewMovePage() {
  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          NYC move profile
        </p>
        <h1 className="font-heading text-3xl">Create a move</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          From/to boroughs, date window, access, and COI. Creating a move seeds
          the six specialist workstreams.
        </p>
      </div>
      <MoveForm />
    </section>
  );
}
