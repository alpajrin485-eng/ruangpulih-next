import Link from "next/link";
import Carousel from "@/components/carousel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,nama")
    .eq("id", data.user?.id ?? "")
    .single();
  const { data: hasil } = await supabase
    .from("quiz_results")
    .select("skor,tanggal,menonton")
    .order("tanggal", { ascending: false })
    .limit(3);

  const nama = profile?.nama || profile?.username || "Pengguna";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 p-8 text-white shadow">
        <h1 className="text-2xl font-extrabold">Dashboard {nama}</h1>
        <p className="text-violet-100">Progres belajar Anda hari ini.</p>
      </div>

      <Carousel />

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-violet-950">Riwayat Kuis Terakhir</h2>
        {!hasil || hasil.length === 0 ? (
          <p className="mt-2 text-slate-500">
            Belum ada riwayat. Silakan mulai kuis pertama Anda.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-slate-600">
            {hasil.map((r, i) => (
              <li key={i}>
                <b>{r.skor}/100</b> — {String(r.tanggal).slice(0, 16).replace("T", " ")} —{" "}
                {r.menonton ? "Sudah menonton video" : r.skor <= 50 ? "Perlu menonton video" : "Baik"}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/kuis" className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white shadow">
            Kerjakan Kuis
          </Link>
          <Link href="/app/refleksi" className="rounded-xl px-5 py-2.5 font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50">
            Refleksi Diri
          </Link>
        </div>
      </section>
    </div>
  );
}
