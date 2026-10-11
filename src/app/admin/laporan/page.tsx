"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  arah: string;
  kategori: string;
  bukti: string | null;
  status: string;
  created_at: string;
  session_id: string | null;
  pelapor: { username: string } | null;
  terlapor: { id: string; username: string } | null;
};

export default function Laporan() {
  const [list, setList] = useState<Report[]>([]);
  const [filter, setFilter] = useState("menunggu");
  const [buka, setBuka] = useState("");
  const [chat, setChat] = useState<Array<{ isi: string; sender_id: string }>>([]);
  const [peringatan, setPeringatan] = useState("");
  const [msg, setMsg] = useState("");
  const supabase = createClient();

  async function muat() {
    const { data } = await supabase
      .from("reports")
      .select("id,arah,kategori,bukti,status,created_at,session_id,pelapor:profiles!reports_pelapor_id_fkey(username),terlapor:profiles!reports_terlapor_id_fkey(id,username)")
      .order("created_at", { ascending: false })
      .limit(200);
    setList((data as unknown as Report[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lihatChat(sessionId: string) {
    setBuka(sessionId);
    const { data } = await supabase.from("messages").select("isi,sender_id").eq("session_id", sessionId).order("created_at").limit(50);
    setChat((data as Array<{ isi: string; sender_id: string }>) ?? []);
  }

  async function putus(r: Report, terbukti: boolean) {
    if (terbukti && !peringatan.trim()) {
      setMsg("Tulis teks peringatan untuk terlapor.");
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("reports").update({
      status: terbukti ? "terbukti" : "tidak",
      keputusan: terbukti ? peringatan.trim() : "Tidak terbukti",
      diputus_oleh: user.user?.id ?? null,
    }).eq("id", r.id);

    if (terbukti && r.terlapor) {
      const { data: w } = await supabase.from("warnings").select("id").eq("user_id", r.terlapor.id);
      const ke = (w ?? []).length + 1;
      await supabase.from("warnings").insert({ user_id: r.terlapor.id, teks: peringatan.trim(), report_id: r.id, ke_berapa: ke });
      if (ke >= 3) {
        await supabase.from("profiles").update({ status: "dibanned", banned_reason: `Peringatan ke-${ke}: ${peringatan.trim()}` }).eq("id", r.terlapor.id);
        setMsg(`Terbukti. Peringatan ke-${ke} — akun ${r.terlapor.username} dibanned permanen.`);
      } else {
        await supabase.from("profiles").update({ status: "diperingatkan" }).eq("id", r.terlapor.id);
        setMsg(`Terbukti. Peringatan ke-${ke} dicatat untuk ${r.terlapor.username}.`);
      }
    } else {
      setMsg("Laporan dinyatakan tidak terbukti dan ditutup.");
    }
    setPeringatan("");
    muat();
  }

  const tampil = list.filter((r) => filter === "semua" || r.status === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-violet-950">Laporan Masuk</h1>
      {msg && <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">{msg}</p>}
      <div className="flex gap-2">
        {["menunggu", "diproses", "terbukti", "tidak", "semua"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === s ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-200"}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {tampil.length === 0 && <p className="rounded-2xl border bg-white p-6 text-center text-slate-400">Tidak ada laporan.</p>}
        {tampil.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="font-bold">
              {r.pelapor?.username} → {r.terlapor?.username}
              <span className="ml-2 text-sm font-semibold text-violet-700">[{r.status}]</span>
            </p>
            <p className="text-sm text-slate-500">{r.arah} · {r.kategori} · {String(r.created_at).slice(0, 16).replace("T", " ")}</p>
            <p className="mt-2 text-sm text-slate-700">{r.bukti}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.session_id && (
                <button onClick={() => (buka === r.session_id ? setBuka("") : lihatChat(r.session_id!))} className="rounded-xl px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                  {buka === r.session_id ? "Tutup Chat" : "Lihat Chat Sesi"}
                </button>
              )}
              {(r.status === "menunggu" || r.status === "diproses") && (
                <>
                  <button onClick={async () => { await supabase.from("reports").update({ status: "diproses" }).eq("id", r.id); muat(); }} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                    Tandai Diproses
                  </button>
                  <button onClick={() => putus(r, false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                    Tidak Terbukti
                  </button>
                </>
              )}
            </div>
            {buka === r.session_id && (
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm">
                {chat.map((c, i) => <p key={i} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-100">{c.isi}</p>)}
              </div>
            )}
            {(r.status === "menunggu" || r.status === "diproses") && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input value={peringatan} onChange={(e) => setPeringatan(e.target.value)} placeholder="Teks peringatan bila terbukti..." className="min-w-64 flex-1 rounded-xl border px-3 py-2 text-sm" />
                <button onClick={() => putus(r, true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
                  Terbukti + Peringatkan
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
