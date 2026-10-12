"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReportForm({
  terlaporId,
  sessionId,
  arah,
  kategoriList,
  onDone,
}: {
  terlaporId: string;
  sessionId?: string;
  arah: "konselor_ke_user" | "user_ke_konselor";
  kategoriList: string[];
  onDone?: () => void;
}) {
  const [buka, setBuka] = useState(false);
  const [kategori, setKategori] = useState(kategoriList[0]);
  const [bukti, setBukti] = useState("");
  const [msg, setMsg] = useState("");

  async function kirim() {
    if (!bukti.trim()) {
      setMsg("Tulis kronologi/bukti terlebih dahulu.");
      return;
    }
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    let q = supabase
      .from("reports")
      .select("id")
      .eq("pelapor_id", user.user.id)
      .eq("terlapor_id", terlaporId)
      .in("status", ["menunggu", "diproses"]);
    q = sessionId ? q.eq("session_id", sessionId) : q.is("session_id", null);
    const { data: dobel } = await q.limit(1);
    if (dobel && dobel.length > 0) {
      setMsg("Laporan untuk kasus ini sudah ada dan sedang diproses admin.");
      return;
    }
    const { error } = await supabase.from("reports").insert({
      pelapor_id: user.user.id,
      terlapor_id: terlaporId,
      session_id: sessionId ?? null,
      arah,
      kategori,
      bukti: bukti.trim(),
    });
    if (error) {
      setMsg("Gagal mengirim laporan.");
      return;
    }
    setBuka(false);
    setBukti("");
    setMsg("");
    onDone?.();
  }

  if (!buka)
    return (
      <button
        onClick={() => setBuka(true)}
        className="rounded-xl px-4 py-2 text-sm font-bold text-red-700 ring-2 ring-red-200 hover:bg-red-50"
      >
        Laporkan
      </button>
    );
  return (
    <div className="space-y-3 rounded-2xl border-2 border-red-100 bg-red-50/50 p-4">
      <p className="font-bold text-red-900">Form Laporan</p>
      <label className="block text-sm font-semibold">Kategori pelanggaran</label>
      <select
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
        className="w-full rounded-xl border bg-white px-3 py-2"
      >
        {kategoriList.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
      <label className="block text-sm font-semibold">Kronologi / bukti</label>
      <textarea
        value={bukti}
        onChange={(e) => setBukti(e.target.value)}
        rows={3}
        placeholder="Ceritakan kejadian + kutip chat yang bermasalah..."
        className="w-full rounded-xl border bg-white px-3 py-2"
      />
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <div className="flex gap-2">
        <button onClick={kirim} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
          Kirim Laporan
        </button>
        <button onClick={() => setBuka(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
          Batal
        </button>
      </div>
    </div>
  );
}
