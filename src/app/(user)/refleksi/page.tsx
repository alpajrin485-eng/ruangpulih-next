"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

const PERTANYAAN = [
  { tanya: "Bagaimana energi Anda saat belajar akhir-akhir ini?", opsi: ["Sangat bersemangat", "Cukup bersemangat", "Biasa saja", "Sering merasa lelah", "Sangat lelah"] },
  { tanya: "Bagaimana kemampuan Anda untuk fokus saat belajar?", opsi: ["Sangat mudah fokus", "Cukup mudah fokus", "Kadang sulit fokus", "Sering sulit fokus", "Sangat sulit fokus"] },
  { tanya: "Bagaimana perasaan Anda ketika melihat tugas sekolah?", opsi: ["Siap mengerjakannya", "Kadang terasa berat", "Biasa saja", "Sering merasa terbebani", "Sangat terbebani"] },
  { tanya: "Seberapa cukup waktu istirahat Anda?", opsi: ["Sangat cukup", "Cukup", "Kadang kurang", "Sering kurang", "Sangat kurang"] },
];

type Riwayat = { j1: number; j2: number; j3: number; j4: number; skor: number; tanggal: string };

function makna(skor: number): [string, string] {
  if (skor <= 4) return ["Kondisi belajar Anda terlihat cukup baik.", "Pertahankan energi, fokus, dan pola istirahat Anda."];
  if (skor <= 10) return ["Anda tampaknya membutuhkan lebih banyak keseimbangan.", "Perhatikan waktu istirahat, beban tugas, dan cara mengatur waktu belajar."];
  return ["Anda mungkin sedang merasa cukup terbebani.", "Ambil waktu beristirahat dan bicarakan beban Anda dengan orang yang dipercaya."];
}

export default function Refleksi() {
  const [jawab, setJawab] = useState<number[]>([0, 0, 0, 0]);
  const [hasil, setHasil] = useState<number | null>(null);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [tersimpan, setTersimpan] = useState("");

  async function muat() {
    const supabase = createClient();
    const { data } = await supabase
      .from("refleksi_results")
      .select("j1,j2,j3,j4,skor,tanggal")
      .order("tanggal", { ascending: false })
      .limit(20);
    setRiwayat((data as Riwayat[]) ?? []);
  }

  useEffect(() => {
    let aktif = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("refleksi_results")
        .select("j1,j2,j3,j4,skor,tanggal")
        .order("tanggal", { ascending: false })
        .limit(20);
      if (aktif) setRiwayat((data as Riwayat[]) ?? []);
    })();
    return () => {
      aktif = false;
    };
  }, []);

  async function simpan() {
    const skor = jawab.reduce((a, b) => a + b, 0);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { error } = await supabase.from("refleksi_results").insert({
      user_id: user.user.id,
      j1: jawab[0], j2: jawab[1], j3: jawab[2], j4: jawab[3], skor,
    });
    if (!error) {
      setHasil(skor);
      setTersimpan("Hasil tersimpan di riwayat Anda.");
      muat();
    }
  }

  const [judul, saran] = hasil === null ? ["", ""] : makna(hasil);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 p-8 text-center text-white shadow">
        <h1 className="text-2xl font-extrabold">Kenali Kondisimu</h1>
        <p className="text-violet-100">Luangkan waktu untuk mengenali kondisi belajar Anda.</p>
      </div>
      <p className="rounded-xl border-l-4 border-violet-600 bg-violet-50 p-4 text-sm text-slate-600">
        Refleksi ini bukan diagnosis psikologis. Hasilnya hanya membantu Anda memahami
        kondisi belajar saat ini.
      </p>

      {PERTANYAAN.map((p, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="font-bold text-violet-950">{i + 1}. {p.tanya}</p>
          <div className="mt-3 space-y-2">
            {p.opsi.map((op, j) => (
              <label key={j} className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 hover:border-violet-300 has-checked:border-violet-500 has-checked:bg-violet-50">
                <input
                  type="radio"
                  name={`r${i}`}
                  checked={jawab[i] === j}
                  onChange={() => setJawab((a) => a.map((v, k) => (k === i ? j : v)))}
                  className="accent-violet-600"
                />
                {op}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={simpan}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow"
      >
        Lihat & Simpan Hasil Refleksi
      </button>

      {hasil !== null && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-bold text-violet-950">{judul}</h2>
          <p className="mt-1 text-slate-600">{saran} (Skor: {hasil}/16)</p>
          <p className="mt-2 text-sm text-slate-400">{tersimpan}</p>
          <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 ring-1 ring-blue-100">
            Catatan: bila kesulitan berlangsung lama atau semakin berat, bicarakan dengan
            orang tua, guru BK, konselor, atau tenaga profesional.
          </p>
        </div>
      )}

      {riwayat.length > 0 && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-bold text-violet-950">Grafik Progres Refleksi</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...riwayat].reverse().map((r) => ({ ...r, waktu: String(r.tanggal).slice(5, 16).replace("T", " ") }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="waktu" fontSize={11} />
                <YAxis domain={[0, 16]} />
                <Tooltip />
                <Line type="monotone" dataKey="skor" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">Semakin rendah skor, semakin baik (rentang 0–16).</p>
        </div>
      )}
    </div>
  );
}
