import { PRODUCT_MOTTO, PRODUCT_NAME } from "@/lib/constants";

export function MissingConfig() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-4 px-4 py-12">
      <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
        {PRODUCT_NAME}
      </p>
      <h1 className="font-heading text-3xl leading-tight">
        Add your Supabase keys to boot locally
      </h1>
      <p className="text-sm text-muted-foreground">{PRODUCT_MOTTO}</p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Copy `.env.local.example` to `.env.local`.</li>
        <li>Paste `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</li>
        <li>Apply `supabase/migrations/0001_init.sql` in the SQL editor.</li>
        <li>Restart `npm run dev`.</li>
      </ol>
    </div>
  );
}
