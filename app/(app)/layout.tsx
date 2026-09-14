import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { MissingConfig } from "@/components/missing-config";
import { requireUser } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/env";

export default async function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!getSupabaseEnv()) {
    return <MissingConfig />;
  }

  const { user } = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader email={user.email} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}
