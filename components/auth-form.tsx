"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signIn, signUp } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import type { ActionState } from "@/lib/move-form";

const initial: ActionState = { error: null };

export function AuthForm({
  mode,
  nextPath,
  errorFromQuery,
}: {
  mode: "signin" | "signup";
  nextPath?: string;
  errorFromQuery?: string;
}) {
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initial);
  const error = state.error ?? errorFromQuery ?? null;

  return (
    <form action={formAction} className="grid gap-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11"
          placeholder="you@example.com"
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint={mode === "signup" ? "At least 8 characters." : undefined}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          className="h-11"
        />
      </Field>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending
          ? "Working…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <Link
              href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
