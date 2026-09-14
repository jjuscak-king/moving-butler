"use client";

import { useEffect } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="font-heading text-4xl">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={cn(buttonVariants(), "h-10 px-3")}>
          Try again
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-3")}>
          Go home
        </Link>
      </div>
    </main>
  );
}
