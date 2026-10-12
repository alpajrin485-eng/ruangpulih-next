import Link from "next/link";
import Carousel from "@/components/carousel";
import Footer from "@/components/footer";
import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FITUR = [
  ["Kenali Diri", "Luangkan waktu untuk memahami kondisi belajar dan perasaan Anda.", "/refleksi"],
  ["Teman Belajar", "Perangkat sederhana untuk mengatur waktu belajar dan istirahat.", "/teman-belajar"],
  ["Edukasi Psikologi", "Pelajari stres belajar, burnout, tidur, dan kebiasaan belajar.", "/edukasi"],
] as const;

type Profil = { username: string; nama: string | null; role: string };
type Skor = { skor: number; tanggal: string; menonton: boolean };

export default async function Beranda() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  let profile: Profil | null = null;
  let riwayat: Skor[] = [];
  if (data.user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("username,nama,role")
      .eq("id", data.user.id)
      .single();
    profile = p as unknown as Profil | null;
    if (profile?.role === "user") {
      const { data: h } = await supabase
        .from("quiz_results")
        .select("skor,tanggal,menonton")
        .order("tanggal", { ascending: false })
        .limit(3);
      riwayat = (h as typeof riwayat) ?? [];
    }
  }
  const nama = profile?.nama || profile?.username || "";

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-blue-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-violet-700 shadow ring-2 ring-violet-200">
            Ψ
          </span>
          <span className="text-xl font-bold text-violet-950">RuangPulih</span>
        </span>
        {data.user ? (
          <LogoutButton />
        ) : (
          <span className="flex gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 font-semibold text-violet-700 ring-2 ring-violet-200 hover:bg-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-semibold text-white shadow hover:opacity-95"
            >
              Daftar
            </Link>
          </span>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-4 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-8 py-14 text-white shadow-xl ring-2 ring-white/60">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl font-bold text-violet-700 shadow ring-4 ring-violet-200">
            Ψ
          </div>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            {profile ? `Dashboard ${nama}` : "Belajar Sehat, Tumbuh Hebat"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-100">
            {profile?.role === "user"
              ? "Progres belajar Anda hari ini."
              : profile
                ? "Kelola RuangPulih dari sini."
                : "Ruang edukasi psikologi untuk membantu pelajar memahami diri, mengelola tekanan belajar, dan menjaga keseimbangan jiwa."}
          </p>
          {!profile && (
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white px-6 py-3 font-bold text-violet-700 shadow hover:bg-violet-50"
              >
                Mulai Sekarang
              </Link>
              <Link
                href="/tentang"
                className="rounded-xl px-6 py-3 font-bold text-white ring-2 ring-white/70 hover:bg-white/10"
              >
                Tentang Kami
              </Link>
            </div>
          )}
          {profile?.role === "admin" && (
            <div className="mt-8">
              <Link href="/admin" className="rounded-xl bg-white px-6 py-3 font-bold text-violet-700 shadow hover:bg-violet-50">
                Buka Dashboard Admin
              </Link>
            </div>
          )}
          {profile?.role === "konselor" && (
            <div className="mt-8">
              <Link href="/konselor" className="rounded-xl bg-white px-6 py-3 font-bold text-violet-700 shadow hover:bg-violet-50">
                Buka Area Konselor
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <Carousel />
      </section>

      {profile?.role === "user" && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-violet-950">Riwayat Kuis Terakhir</h2>
            {riwayat.length === 0 ? (
              <p className="mt-2 text-slate-500">Belum ada riwayat. Silakan mulai kuis pertama Anda.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-slate-600">
                {riwayat.map((r, i) => (
                  <li key={i}>
                    <b>{r.skor}/100</b> — {String(r.tanggal).slice(0, 16).replace("T", " ")} —{" "}
                    {r.menonton ? "Sudah menonton video" : r.skor <= 50 ? "Perlu menonton video" : "Baik"}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/kuis" className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white shadow">
                Kerjakan Kuis
              </Link>
              <Link href="/refleksi" className="rounded-xl px-5 py-2.5 font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50">
                Refleksi Diri
              </Link>
              <Link href="/konsultasi" className="rounded-xl px-5 py-2.5 font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50">
                Konsultasi
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3">
        {FITUR.map(([t, d, href]) => (
          <Link
            key={t}
            href={profile ? href : "/login"}
            className="rounded-2xl border-2 border-violet-100 border-t-4 border-t-violet-600 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-violet-900">{t}</h3>
            <p className="mt-2 text-slate-600">{d}</p>
          </Link>
        ))}
      </section>

      <Footer />
    </main>
  );
}
