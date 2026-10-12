"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReportForm from "@/components/report-form";

type Pesan = { id: string; sender_id: string; isi: string; created_at: string };
type InfoSesi = {
  id: string;
  status: string;
  user_id: string;
  counselors: { user_id: string; profiles: { nama: string | null } | null } | null;
};

const KATEGORI_USER = ["Chat tidak pantas", "Pelecehan", "Spam", "Lainnya"];

export default function ChatUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sesi, setSesi] = useState<InfoSesi | null>(null);
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [teks, setTeks] = useState("");
  const [uid, setUid] = useState("");
  const [bintang, setBintang] = useState(5);
  const [ulasan, setUlasan] = useState("");
  const [sudahRating, setSudahRating] = useState(false);
  const bawah = useRef<HTMLDivElement>(null);

  async function muat() {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    setUid(user.user.id);
    const { data: s } = await supabase
      .from("sessions")
      .select("id,status,user_id,counselors(user_id,profiles(nama))")
      .eq("id", id)
      .eq("user_id", user.user.id)
      .single();
    if (!s) {
      setSesi(null);
      return;
    }
    setSesi(s as unknown as InfoSesi);
    const { data: m } = await supabase
      .from("messages")
      .select("id,sender_id,isi,created_at")
      .eq("session_id", id)
      .order("created_at");
    setPesan((m as Pesan[]) ?? []);
    const { data: r } = await supabase.from("ratings").select("id").eq("session_id", id).limit(1);
    setSudahRating(!!r && r.length > 0);
  }

  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    const i = setInterval(muat, 5000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan]);

  async function kirim() {
    if (!teks.trim() || sesi?.status !== "diterima") return;
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from("messages").insert({ session_id: id, sender_id: user.user.id, isi: teks.trim() });
    setTeks("");
    muat();
  }

  async function tutup() {
    const supabase = createClient();
    await supabase.from("sessions").update({ status: "selesai", closed_at: new Date().toISOString() }).eq("id", id);
    muat();
  }

  async function beriRating() {
    const supabase = createClient();
    const { error } = await supabase.from("ratings").insert({ session_id: id, bintang, ulasan: ulasan.trim() || null });
    if (!error) {
      setSudahRating(true);
      muat();
    }
  }

  if (sesi === null)
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-500 shadow-sm">
        Sesi tidak ditemukan. <Link href="/konsultasi" className="font-bold text-violet-700">Kembali</Link>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-violet-950">
          Chat — {sesi.counselors?.profiles?.nama ?? "Konselor"} ({sesi.status})
        </h1>
        <Link href="/konsultasi" className="text-sm font-bold text-violet-700">← Sesi saya</Link>
      </div>

      <div className="h-96 space-y-2 overflow-y-auto rounded-2xl border bg-white p-4 shadow-sm">
        {pesan.length === 0 && <p className="text-sm text-slate-400">Belum ada pesan. Mulai percakapan...</p>}
        {pesan.map((p) => (
          <div key={p.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${p.sender_id === uid ? "ml-auto bg-violet-600 text-white" : "bg-slate-100 text-slate-700"}`}>
            {p.isi}
          </div>
        ))}
        <div ref={bawah} />
      </div>

      {sesi.status === "diterima" && (
        <div className="flex gap-2">
          <input
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && kirim()}
            placeholder="Tulis pesan..."
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button onClick={kirim} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 font-bold text-white">
            Kirim
          </button>
        </div>
      )}
      {sesi.status === "menunggu" && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Menunggu konselor menerima sesi.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sesi.status === "diterima" && (
          <button onClick={tutup} className="rounded-xl px-4 py-2 text-sm font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50">
            Tutup Sesi (Selesai)
          </button>
        )}
        <ReportForm
          terlaporId={sesi.counselors?.user_id ?? ""}
          sessionId={id}
          arah="user_ke_konselor"
          kategoriList={KATEGORI_USER}
        />
      </div>

      {sesi.status === "selesai" &&
        (sudahRating ? (
          <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700 ring-1 ring-green-200">
            Terima kasih atas penilaian Anda.
          </p>
        ) : (
          <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold text-violet-950">Nilai Konselor (1–5 bintang)</h2>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((b) => (
                <button key={b} onClick={() => setBintang(b)} className={`text-3xl ${b <= bintang ? "text-amber-400" : "text-slate-300"}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={ulasan}
              onChange={(e) => setUlasan(e.target.value)}
              rows={2}
              placeholder="Ulasan opsional..."
              className="w-full rounded-xl border px-3 py-2"
            />
            <button onClick={beriRating} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white">
              Kirim Penilaian
            </button>
          </div>
        ))}
    </div>
  );
}
