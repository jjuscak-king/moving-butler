import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MoveNotFound() {
  return (
    <div className="grid gap-3 py-10">
      <h1 className="font-heading text-3xl">{CASE_FILE_LABEL} not found</h1>
      <p className="text-sm text-muted-foreground">
        That {CASE_FILE_LABEL_SHORT} doesn&apos;t exist or you don&apos;t have
        access to it.
      </p>
      <Link href="/" className={cn(buttonVariants(), "h-10 w-fit px-3")}>
        Back to {CASE_FILE_LABEL_SHORT}s
      </Link>
    </div>
  );
}
