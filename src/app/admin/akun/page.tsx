"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Akun = { id: string; username: string; role: string; status: string; banned_reason: string | null };
type Agg = { user: Akun; reports: number; warnings: number };

export default function Akun() {
  const [tab, setTab] = useState<"terlapor" | "banned">("terlapor");
  const [agg, setAgg] = useState<Agg[]>([]);
  const [banned, setBanned] = useState<Akun[]>([]);
  const [arsip, setArsip] = useState<string>("");
  const [detail, setDetail] = useState<Array<{ skor: number; tanggal: string }>>([]);
  const supabase = createClient();

  async function muat() {
    const { data: users } = await supabase.from("profiles").select("id,username,role,status,banned_reason").order("username");
    const { data: reps } = await supabase.from("reports").select("terlapor_id");
    const { data: warns } = await supabase.from("warnings").select("user_id");
    const cR: Record<string, number> = {};
    (reps ?? []).forEach((r: { terlapor_id: string }) => {
      cR[r.terlapor_id] = (cR[r.terlapor_id] ?? 0) + 1;
    });
    const cW: Record<string, number> = {};
    (warns ?? []).forEach((w: { user_id: string }) => {
      cW[w.user_id] = (cW[w.user_id] ?? 0) + 1;
    });
    const rows = (users as Akun[] | null) ?? [];
    setAgg(rows.filter((u) => (cR[u.id] ?? 0) > 0).map((u) => ({ user: u, reports: cR[u.id], warnings: cW[u.id] ?? 0 })));
    setBanned(rows.filter((u) => u.status === "dibanned"));
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lihatArsip(id: string) {
    setArsip(id);
    const { data: k } = await supabase.from("quiz_results").select("skor,tanggal").eq("user_id", id).order("tanggal", { ascending: false }).limit(20);
    setDetail(((k as Array<{ skor: number; tanggal: string }>) ?? []).map((x) => ({ ...x, tanggal: String(x.tanggal).slice(0, 16).replace("T", " ") })));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-violet-950">Pemantauan Akun</h1>
      <div className="flex gap-2">
        {(["terlapor", "banned"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-200"}`}>
            {t === "terlapor" ? "Terlapor" : "Terbanned"}
          </button>
        ))}
      </div>

      {tab === "terlapor" && (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-violet-50 text-left text-violet-900">
                <th className="px-4 py-2">Akun</th>
                <th className="px-4 py-2">Peran</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Report</th>
                <th className="px-4 py-2">Peringatan</th>
              </tr>
            </thead>
            <tbody>
              {agg.map((a) => (
                <tr key={a.user.id} className="border-t">
                  <td className="px-4 py-2 font-semibold">{a.user.username}</td>
                  <td className="px-4 py-2">{a.user.role}</td>
                  <td className="px-4 py-2">{a.user.status}</td>
                  <td className="px-4 py-2">{a.reports}</td>
                  <td className="px-4 py-2">{a.warnings}/3</td>
                </tr>
              ))}
              {agg.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Belum ada akun terlapor.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "banned" && (
        <div className="space-y-3">
          {banned.length === 0 && <p className="rounded-2xl border bg-white p-6 text-center text-slate-400">Belum ada akun terbanned.</p>}
          {banned.map((u) => (
            <div key={u.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="font-bold">{u.username} <span className="text-sm text-red-600">[dibanned permanen]</span></p>
              <p className="text-sm text-slate-500">Alasan: {u.banned_reason ?? "-"}</p>
              <button onClick={() => (arsip === u.id ? setArsip("") : lihatArsip(u.id))} className="mt-2 rounded-xl px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                {arsip === u.id ? "Tutup Arsip" : "Lihat Arsip"}
              </button>
              {arsip === u.id && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {detail.length === 0 && <li>Tidak ada riwayat kuis.</li>}
                  {detail.map((d, i) => <li key={i}>{d.skor}/100 — {d.tanggal}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
