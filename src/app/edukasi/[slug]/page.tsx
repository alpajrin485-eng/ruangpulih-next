import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";

export default async function MateriDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("materi")
    .select("judul,intro,isi")
    .eq("slug", slug)
    .eq("aktif", true)
    .single();
  if (!data) notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/edukasi" className="text-sm font-bold text-violet-700">
        ← Semua materi
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-violet-950">{data.judul}</h1>
      {data.intro && <p className="mt-2 text-lg text-slate-600">{data.intro}</p>}
      <article className="prose mt-6 max-w-none rounded-2xl border bg-white p-8 shadow-sm prose-headings:text-violet-900 prose-a:text-violet-700">
        <ReactMarkdown>{data.isi}</ReactMarkdown>
      </article>
    </main>
  );
}
