import { ProductIntro } from "@/components/product-intro";

export function MissingConfig() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-4 px-4 py-12">
      <ProductIntro compact />
      <h2 className="font-heading text-2xl leading-tight">
        Add your Supabase keys to boot locally
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Copy `.env.local.example` to `.env.local`.</li>
        <li>Paste `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</li>
        <li>Apply `supabase/migrations/0001_init.sql` in the SQL editor.</li>
        <li>Restart `npm run dev`.</li>
      </ol>
    </div>
  );
}
