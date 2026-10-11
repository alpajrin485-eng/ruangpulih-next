"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Baris = { username: string; skor: number; tanggal: string; extra: string };

function keCSV(baris: Baris[], kolom: string[]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [kolom.join(","), ...baris.map((b) => [b.username, b.skor, b.tanggal, b.extra].map(esc).join(","))].join("\n");
}

function unduh(nama: string, isi: string) {
  const blob = new Blob([isi], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Hasil() {
  const [tab, setTab] = useState<"kuis" | "refleksi">("kuis");
  const [q, setQ] = useState<Baris[]>([]);
  const [r, setR] = useState<Baris[]>([]);
  const [cari, setCari] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: users } = await supabase.from("profiles").select("id,username");
      const nama: Record<string, string> = {};
      (users ?? []).forEach((u: { id: string; username: string }) => {
        nama[u.id] = u.username;
      });
      const { data: k } = await supabase.from("quiz_results").select("user_id,skor,tanggal,menonton").order("tanggal", { ascending: false }).limit(500);
      setQ(((k as Array<{ user_id: string; skor: number; tanggal: string; menonton: boolean }>) ?? []).map((x) => ({
        username: nama[x.user_id] ?? x.user_id.slice(0, 8),
        skor: x.skor, tanggal: String(x.tanggal).slice(0, 16).replace("T", " "),
        extra: x.menonton ? "sudah menonton" : "belum",
      })));
      const { data: f } = await supabase.from("refleksi_results").select("user_id,skor,tanggal").order("tanggal", { ascending: false }).limit(500);
      setR(((f as Array<{ user_id: string; skor: number; tanggal: string }>) ?? []).map((x) => ({
        username: nama[x.user_id] ?? x.user_id.slice(0, 8),
        skor: x.skor, tanggal: String(x.tanggal).slice(0, 16).replace("T", " "),
        extra: "",
      })));
    })();
  }, []);

  const tampil = (tab === "kuis" ? q : r).filter((b) => b.username.toLowerCase().includes(cari.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-violet-950">Hasil Pengguna</h1>
      <div className="flex flex-wrap gap-2">
        {(["kuis", "refleksi"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-200"}`}>
            {t === "kuis" ? "Kuis" : "Refleksi"}
          </button>
        ))}
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari username..." className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
        <button onClick={() => unduh(`hasil-${tab}.csv`, keCSV(tampil, ["username", "skor", "tanggal", "keterangan"]))} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-bold text-white">
          Ekspor CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-violet-50 text-left text-violet-900">
              <th className="px-4 py-2">Pengguna</th>
              <th className="px-4 py-2">Skor</th>
              <th className="px-4 py-2">Tanggal</th>
              {tab === "kuis" && <th className="px-4 py-2">Video</th>}
            </tr>
          </thead>
          <tbody>
            {tampil.map((b, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-semibold">{b.username}</td>
                <td className="px-4 py-2">{b.skor}</td>
                <td className="px-4 py-2">{b.tanggal}</td>
                {tab === "kuis" && <td className="px-4 py-2">{b.extra}</td>}
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
