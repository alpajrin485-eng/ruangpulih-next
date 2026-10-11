"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReportForm from "@/components/report-form";

type Sesi = {
  id: string;
  status: string;
  keluhan: string | null;
  created_at: string;
  user_id: string;
  profiles: { username: string; nama: string | null } | null;
};
type Pesan = { id: string; sender_id: string; isi: string; created_at: string };

const KATEGORI_KONSELOR = ["Melanggar kode etik", "Mempermainkan konselor", "Chat tidak pantas"];

export default function KonselorHome() {
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const [aktifId, setAktifId] = useState("");
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [teks, setTeks] = useState("");
  const [uid, setUid] = useState("");
  const [fu, setFu] = useState({ materi: "", plan: "", fokus: "25", istirahat: "5" });
  const [ratingSaya, setRatingSaya] = useState<{ avg: number; n: number } | null>(null);
  const bawah = useRef<HTMLDivElement>(null);

  async function muat(pilihId?: string) {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    setUid(user.user.id);
    const { data: k } = await supabase.from("counselors").select("id").eq("user_id", user.user.id).single();
    if (!k) return;
    const { data: s } = await supabase
      .from("sessions")
      .select("id,status,keluhan,created_at,user_id,profiles(username,nama)")
      .eq("counselor_id", k.id)
      .order("created_at", { ascending: false });
    setSesi((s as unknown as Sesi[]) ?? []);
    const cur = pilihId ?? aktifId;
    if (cur) {
      const { data: m } = await supabase
        .from("messages")
        .select("id,sender_id,isi,created_at")
        .eq("session_id", cur)
        .order("created_at");
      setPesan((m as Pesan[]) ?? []);
      const { data: f } = await supabase.from("followups").select("*").eq("session_id", cur).single();
      if (f)
        setFu({
          materi: f.materi_custom ?? "",
          plan: f.plan ?? "",
          fokus: String(f.focus_minutes ?? 25),
          istirahat: String(f.rest_minutes ?? 5),
        });
    }
    const { data: r } = await supabase.rpc("counselor_rating_stats");
    const mine = ((r as unknown as Array<{ counselor_id: string; avg: number; n: number }>) ?? []).find(
      (x) => x.counselor_id === k.id
    );
    if (mine) setRatingSaya({ avg: Number(mine.avg), n: Number(mine.n) });
  }

  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    const i = setInterval(() => muat(), 8000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktifId]);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan]);

  async function ubahStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("sessions").update({ status, closed_at: status === "selesai" ? new Date().toISOString() : null }).eq("id", id);
    if (status !== "diterima" && aktifId === id) {
      setAktifId("");
      setPesan([]);
    }
    muat();
  }

  async function kirim() {
    if (!teks.trim() || !aktifId) return;
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from("messages").insert({ session_id: aktifId, sender_id: user.user.id, isi: teks.trim() });
    setTeks("");
    muat(aktifId);
  }

  async function simpanFollowup() {
    if (!aktifId) return;
    const supabase = createClient();
    await supabase.from("followups").upsert(
      {
        session_id: aktifId,
        materi_custom: fu.materi.trim() || null,
        plan: fu.plan.trim() || null,
        focus_minutes: parseInt(fu.fokus) || 25,
        rest_minutes: parseInt(fu.istirahat) || 5,
        sudah_diisi: true,
      },
      { onConflict: "session_id" }
    );
    muat(aktifId);
  }

  const aktif = sesi.find((s) => s.id === aktifId);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-violet-700 p-8 text-white shadow">
        <h1 className="text-2xl font-extrabold">Area Konselor</h1>
        <p className="text-blue-100">
          {ratingSaya ? `Rating Anda: ★ ${ratingSaya.avg} dari ${ratingSaya.n} sesi.` : "Belum ada rating."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-blue-950">Sesi Masuk</h2>
          <ul className="mt-2 space-y-2">
            {sesi.length === 0 && <p className="text-sm text-slate-400">Belum ada sesi.</p>}
            {sesi.map((s) => (
              <li key={s.id} className={`rounded-xl border px-4 py-3 ${aktifId === s.id ? "ring-2 ring-blue-400" : ""}`}>
                <p className="font-bold">{s.profiles?.nama ?? s.profiles?.username} — <span className="text-sm text-blue-700">{s.status}</span></p>
                <p className="text-sm text-slate-500">{s.keluhan}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(s.status === "diterima" || s.status === "selesai") && (
                    <button onClick={() => { setAktifId(s.id); muat(s.id); }} className="rounded-lg px-3 py-1.5 text-sm font-bold text-blue-700 ring-1 ring-blue-200">
                      Buka
                    </button>
                  )}
                  {s.status === "menunggu" && (
                    <>
                      <button onClick={() => ubahStatus(s.id, "diterima")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">Terima</button>
                      <button onClick={() => ubahStatus(s.id, "ditolak")} className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200">Tolak</button>
                    </>
                  )}
                  {s.status === "diterima" && (
                    <button onClick={() => ubahStatus(s.id, "selesai")} className="rounded-lg px-3 py-1.5 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                      Selesaikan
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-blue-950">Chat {aktif ? `— ${aktif.profiles?.nama}` : ""}</h2>
          {!aktifId ? (
            <p className="text-sm text-slate-400">Pilih sesi untuk mulai chat.</p>
          ) : (
            <>
              <div className="h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                {pesan.map((p) => (
                  <div key={p.id} className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${p.sender_id === uid ? "ml-auto bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                    {p.isi}
                  </div>
                ))}
                <div ref={bawah} />
              </div>
              {aktif?.status === "diterima" && (
                <div className="flex gap-2">
                  <input
                    value={teks}
                    onChange={(e) => setTeks(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && kirim()}
                    placeholder="Tulis pesan..."
                    className="flex-1 rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button onClick={kirim} className="rounded-xl bg-blue-600 px-5 font-bold text-white">Kirim</button>
                </div>
              )}
              {aktif && (
                <ReportForm
                  terlaporId={aktif.user_id}
                  sessionId={aktif.id}
                  arah="konselor_ke_user"
                  kategoriList={KATEGORI_KONSELOR}
                />
              )}
              <div className="rounded-2xl bg-violet-50/60 p-4 ring-1 ring-violet-100">
                <h3 className="font-bold text-violet-950">Materi, Plan & Timer untuk User</h3>
                <label className="mb-1 mt-2 block text-sm font-semibold">Materi yang harus dipelajari</label>
                <textarea value={fu.materi} onChange={(e) => setFu({ ...fu, materi: e.target.value })} rows={2} className="w-full rounded-xl border bg-white px-3 py-2" />
                <label className="mb-1 mt-2 block text-sm font-semibold">Plan tindak lanjut</label>
                <textarea value={fu.plan} onChange={(e) => setFu({ ...fu, plan: e.target.value })} rows={2} className="w-full rounded-xl border bg-white px-3 py-2" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-sm font-semibold">Fokus (mnt)
                    <input value={fu.fokus} onChange={(e) => setFu({ ...fu, fokus: e.target.value })} type="number" min={1} max={120} className="mt-1 w-full rounded-xl border bg-white px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Istirahat (mnt)
                    <input value={fu.istirahat} onChange={(e) => setFu({ ...fu, istirahat: e.target.value })} type="number" min={1} max={60} className="mt-1 w-full rounded-xl border bg-white px-3 py-2" />
                  </label>
                </div>
                <button onClick={simpanFollowup} className="mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white">
                  Simpan untuk User
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
