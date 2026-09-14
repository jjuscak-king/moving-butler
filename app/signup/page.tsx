import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { MissingConfig } from "@/components/missing-config";
import { ProductIntro } from "@/components/product-intro";
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
        <ProductIntro kicker="Create an account to open a Relocation Case File." />
      </Link>
      <AuthForm mode="signup" />
    </main>
  );
}
