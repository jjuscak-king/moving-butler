import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/constants";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="min-w-0">
          <p className="truncate font-heading text-lg leading-none">{PRODUCT_NAME}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            NYC move orchestration
          </p>
        </Link>
        <div className="flex items-center gap-2">
          {email ? (
            <p className="hidden max-w-40 truncate text-xs text-muted-foreground sm:block">
              {email}
            </p>
          ) : null}
          <form action={signOut}>
            <Button type="submit" variant="outline" className="h-10">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
