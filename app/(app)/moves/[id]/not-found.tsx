import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MoveNotFound() {
  return (
    <div className="grid gap-3 py-10">
      <h1 className="font-heading text-3xl">Move not found</h1>
      <p className="text-sm text-muted-foreground">
        That move doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/" className={cn(buttonVariants(), "h-10 w-fit px-3")}>
        Back to moves
      </Link>
    </div>
  );
}
