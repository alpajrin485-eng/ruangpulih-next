"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type RatingRow = { nama: string; avg: number; n: number };
export type KatRow = { kategori: string; skor: number };
export type TrenRow = { hari: string; rata: number };

export default function Charts({
  rating,
  kategori,
  tren,
}: {
  rating: RatingRow[];
  kategori: KatRow[];
  tren: TrenRow[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-violet-950">Rating Konselor</h2>
        {rating.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Belum ada rating.</p>
        ) : (
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rating} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="nama" width={110} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" name="Bintang" fill="#7C3AED" />
                <Bar dataKey="n" name="Sesi" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-violet-950">Statistik 4 Kategori (0–100, makin tinggi makin baik)</h2>
        <p className="text-xs text-slate-400">Dipetakan dari jawaban refleksi seluruh user.</p>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kategori}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kategori" fontSize={11} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="skor" name="Skor" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
        <h2 className="font-bold text-violet-950">Tren Rata-rata Skor Kuis (14 hari)</h2>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tren}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hari" fontSize={11} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rata" name="Rata-rata" stroke="#7C3AED" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
