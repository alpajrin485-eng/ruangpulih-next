import { createClient } from "@/lib/supabase/server";
import Charts, { type KatRow, type RatingRow, type TrenRow } from "./charts";

export const dynamic = "force-dynamic";

const baik = (j: number) => 100 - j * 25;

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ count: users }, { count: sesi }, { count: hasil }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
    supabase.from("quiz_results").select("*", { count: "exact", head: true }),
  ]);

  const { data: stats } = await supabase.rpc("counselor_rating_stats");
  const { data: kons } = await supabase.from("counselors").select("id,profiles(nama,username)");
  const nama: Record<string, string> = {};
  ((kons as unknown as Array<{ id: string; profiles: { nama: string | null; username: string } | null }>) ?? []).forEach(
    (k) => {
      nama[k.id] = k.profiles?.nama ?? k.profiles?.username ?? "?";
    }
  );
  const rating: RatingRow[] = (
    (stats as Array<{ counselor_id: string; avg: number; n: number }>) ?? []
  ).map((s) => ({ nama: nama[s.counselor_id] ?? "?", avg: Number(s.avg), n: Number(s.n) }));

  const { data: ref } = await supabase.from("refleksi_results").select("j1,j2,j3,j4");
  const rows = (ref as Array<{ j1: number; j2: number; j3: number; j4: number }>) ?? [];
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const kategori: KatRow[] = [
    // j2 fokus → prokrastinasi, j1 energi → burnout, j3 tugas → stres, j4 istirahat → istirahat
    { kategori: "Prokrastinasi", skor: avg(rows.map((r) => baik(r.j2))) },
    { kategori: "Burnout", skor: avg(rows.map((r) => baik(r.j1))) },
    { kategori: "Stres", skor: avg(rows.map((r) => baik(r.j3))) },
    { kategori: "Istirahat", skor: avg(rows.map((r) => baik(r.j4))) },
  ];

  const { data: q } = await supabase.from("quiz_results").select("skor,tanggal").order("tanggal", { ascending: false }).limit(300);
  const perHari: Record<string, number[]> = {};
  ((q as Array<{ skor: number; tanggal: string }>) ?? []).forEach((x) => {
    const h = String(x.tanggal).slice(0, 10);
    perHari[h] = perHari[h] ?? [];
    perHari[h].push(x.skor);
  });
  const tren: TrenRow[] = Object.keys(perHari)
    .sort()
    .slice(-14)
    .map((h) => ({ hari: h.slice(5), rata: Math.round(perHari[h].reduce((a, b) => a + b, 0) / perHari[h].length) }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-violet-800 to-indigo-800 p-8 text-white shadow">
        <h1 className="text-2xl font-extrabold">Dashboard Admin</h1>
        <p className="text-violet-200">Kelola konten dan pantau seluruh aktivitas.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Total Pengguna", String(users ?? 0)],
          ["Total Sesi Konsultasi", String(sesi ?? 0)],
          ["Pengerjaan Kuis", String(hasil ?? 0)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-400">{t}</p>
            <p className="text-3xl font-extrabold text-violet-900">{v}</p>
          </div>
        ))}
      </div>
      <Charts rating={rating} kategori={kategori} tren={tren} />
    </div>
  );
}
