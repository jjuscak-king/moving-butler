import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center gap-4 px-4 py-16">
      <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        {PRODUCT_NAME}
      </p>
      <h1 className="font-heading text-4xl">Page not found</h1>
      <p className="text-muted-foreground">
        That route isn&apos;t part of the Week 1 shell.
      </p>
      <Link href="/" className={cn(buttonVariants(), "h-10 w-fit px-3")}>
        Go home
      </Link>
    </main>
  );
}
