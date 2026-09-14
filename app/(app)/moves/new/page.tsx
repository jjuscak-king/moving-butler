import { MoveForm } from "@/components/move-form";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";

export const metadata = {
  title: `New ${CASE_FILE_LABEL_SHORT}`,
};

export default function NewMovePage() {
  return (
    <section className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {CASE_FILE_LABEL}
        </p>
        <h1 className="font-heading text-3xl">Create a {CASE_FILE_LABEL_SHORT}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          From/to boroughs, date window, access, and COI. Creating a Case File
          seeds the six journey stages.
        </p>
      </div>
      <MoveForm />
    </section>
  );
}
