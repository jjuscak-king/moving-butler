"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { acceptMoveInvite } from "@/app/actions/invites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import type { MoveInvitePreview } from "@/lib/database.types";

export function JoinInviteForm({
  token,
  invite,
}: {
  token: string;
  invite: MoveInvitePreview;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (invite.revoked) {
    return (
      <Alert variant="destructive">
        <AlertDescription>This invite link has been revoked.</AlertDescription>
      </Alert>
    );
  }

  if (invite.already_member || invite.is_owner) {
    return (
      <Button
        nativeButton={false}
        className="h-11 w-full"
        render={<Link href={`/moves/${invite.move_id}`} />}
      >
        Open {CASE_FILE_LABEL_SHORT}
      </Button>
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        className="h-11 w-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await acceptMoveInvite(token);
            if (result?.error) setError(result.error);
          });
        }}
      >
        {pending ? "Joining…" : `Join this ${CASE_FILE_LABEL}`}
      </Button>
    </div>
  );
}
