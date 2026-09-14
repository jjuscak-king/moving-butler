import { JoinInviteForm } from "@/components/join-invite-form";
import { requireUser } from "@/lib/auth";
import { CASE_FILE_LABEL, CASE_FILE_LABEL_SHORT } from "@/lib/constants";
import { formatMoveDate } from "@/lib/format";

export const metadata = {
  title: `Join ${CASE_FILE_LABEL_SHORT}`,
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("get_move_invite", { p_token: token });
  const invite = data?.[0];

  return (
    <section className="mx-auto grid max-w-lg gap-4 py-6">
      <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Co-mover invite
      </p>
      <h1 className="font-heading text-3xl leading-tight">
        {invite ? invite.move_label : `Join a ${CASE_FILE_LABEL}`}
      </h1>
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : invite ? (
        <>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be able to view this {CASE_FILE_LABEL_SHORT}, claim tasks, and
            mark them complete. Money, legal, and irreversible changes stay with
            the owner. Link good through {formatMoveDate(invite.expires_at.slice(0, 10))}.
          </p>
          <JoinInviteForm token={token} invite={invite} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          That invite link is not valid. Ask the owner to copy a new one from the
          Case File.
        </p>
      )}
    </section>
  );
}
