import { redirect } from "next/navigation";

export default async function MoveDayRunbookRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/moves/${id}/move-day`);
}
