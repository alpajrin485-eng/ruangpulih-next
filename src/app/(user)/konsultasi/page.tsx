"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReportForm from "@/components/report-form";

type Konselor = {
  id: string;
  user_id: string;
  spesialisasi: string | null;
  foto_url: string | null;
  bio: string | null;
  profiles: { username: string; nama: string | null } | null;
};

type Sesi = {
  id: string;
  status: string;
  keluhan: string | null;
  created_at: string;
  counselors: { profiles: { nama: string | null; username: string } | null } | null;
};

const KATEGORI_USER = ["Chat tidak pantas", "Pelecehan", "Spam", "Lainnya"];

export default function Konsultasi() {
  const [konselor, setKonselor] = useState<Konselor[]>([]);
  const [rating, setRating] = useState<Record<string, { avg: number; n: number }>>({});
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const [pilih, setPilih] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [msg, setMsg] = useState("");

  async function muat() {
    const supabase = createClient();
    const { data: k } = await supabase
      .from("counselors")
      .select("id,user_id,spesialisasi,foto_url,bio,profiles(username,nama)")
      .eq("aktif", true);
    setKonselor((k as unknown as Konselor[]) ?? []);
    const { data: r } = await supabase.rpc("counselor_rating_stats");
    const agg: Record<string, { avg: number; n: number }> = {};
    ((r as unknown as Array<{ counselor_id: string; avg: number; n: number }>) ?? []).forEach(
      (x) => {
        agg[x.counselor_id] = { avg: Number(x.avg), n: Number(x.n) };
      }
    );
    setRating(agg);
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { data: s } = await supabase
        .from("sessions")
        .select("id,status,keluhan,created_at,counselors(profiles(username,nama))")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });
      setSesi((s as unknown as Sesi[]) ?? []);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
  }, []);

  async function ajukan() {
    if (!pilih || !keluhan.trim()) {
      setMsg("Pilih konselor dan tulis keluhan awal.");
      return;
    }
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { error } = await supabase.from("sessions").insert({
      user_id: user.user.id,
      counselor_id: pilih,
      keluhan: keluhan.trim(),
    });
    if (error) {
      setMsg("Gagal mengajukan sesi.");
      return;
    }
    setPilih("");
    setKeluhan("");
    setMsg("Sesi diajukan. Tunggu konselor menerima.");
    muat();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-violet-950">Konsultasi</h1>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-violet-950">Pilih Konselor</h2>
        {konselor.length === 0 && (
          <p className="mt-2 text-slate-500">Belum ada konselor tersedia.</p>
        )}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {konselor.map((k) => (
            <div key={k.id} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-bold text-white">
                  {(k.profiles?.nama ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="font-bold">{k.profiles?.nama ?? k.profiles?.username}</p>
                  <p className="text-sm text-slate-500">{k.spesialisasi ?? "Konselor"}</p>
                  <p className="text-sm text-amber-600">
                    ★ {rating[k.id] ? `${rating[k.id].avg} (${rating[k.id].n} sesi)` : "Belum ada rating"}
                  </p>
                </div>
              </div>
              {k.bio && <p className="mt-2 text-sm text-slate-600">{k.bio}</p>}
              <div className="mt-3">
                <ReportForm
                  terlaporId={k.user_id}
                  arah="user_ke_konselor"
                  kategoriList={KATEGORI_USER}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-violet-950">Ajukan Sesi Baru</h2>
        <label className="mb-1 mt-3 block text-sm font-semibold">Konselor</label>
        <select
          value={pilih}
          onChange={(e) => setPilih(e.target.value)}
          className="w-full rounded-xl border bg-white px-3 py-2"
        >
          <option value="">-- pilih --</option>
          {konselor.map((k) => (
            <option key={k.id} value={k.id}>
              {k.profiles?.nama ?? k.profiles?.username}
            </option>
          ))}
        </select>
        <label className="mb-1 mt-3 block text-sm font-semibold">Keluhan awal</label>
        <textarea
          value={keluhan}
          onChange={(e) => setKeluhan(e.target.value)}
          rows={3}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Ceritakan singkat yang ingin dikonsultasikan..."
        />
        {msg && <p className="mt-2 text-sm text-violet-900">{msg}</p>}
        <button
          onClick={ajukan}
          className="mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white shadow"
        >
          Kirim Pengajuan
        </button>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-violet-950">Sesi Saya</h2>
        {sesi.length === 0 && <p className="mt-2 text-slate-500">Belum ada sesi.</p>}
        <ul className="mt-2 space-y-2">
          {sesi.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p className="font-bold">
                  {s.counselors?.profiles?.nama ?? "Konselor"} —{" "}
                  <span className="text-sm font-semibold text-violet-700">{s.status}</span>
                </p>
                <p className="text-sm text-slate-500">{String(s.created_at).slice(0, 16).replace("T", " ")}</p>
              </div>
              {(s.status === "diterima" || s.status === "selesai") && (
                <Link
                  href={`/konsultasi/${s.id}`}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50"
                >
                  Buka Chat
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
