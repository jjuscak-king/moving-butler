import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { MissingConfig } from "@/components/missing-config";
import { PRODUCT_MOTTO, PRODUCT_NAME } from "@/lib/constants";
import { getSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Create account",
};

export default function SignupPage() {
  if (!getSupabaseEnv()) {
    return <MissingConfig />;
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Link href="/signup" className="mb-8">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          {PRODUCT_NAME}
        </p>
        <h1 className="mt-2 font-heading text-4xl leading-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">{PRODUCT_MOTTO}</p>
      </Link>
      <AuthForm mode="signup" />
    </main>
  );
}
