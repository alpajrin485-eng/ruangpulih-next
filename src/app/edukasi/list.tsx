"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type MateriRingkas = { slug: string; judul: string; intro: string | null };

export default function EdukasiList({ items }: { items: MateriRingkas[] }) {
  const [cari, setCari] = useState("");
  const tampil = useMemo(
    () =>
      items.filter(
        (m) =>
          m.judul.toLowerCase().includes(cari.toLowerCase()) ||
          (m.intro ?? "").toLowerCase().includes(cari.toLowerCase())
      ),
    [items, cari]
  );
  return (
    <div>
      <input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari materi..."
        className="mb-6 w-full rounded-xl border bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
      />
      {tampil.length === 0 && (
        <p className="rounded-2xl border bg-white p-6 text-center text-slate-500">
          Tidak ada materi yang cocok.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {tampil.map((m) => (
          <Link
            key={m.slug}
            href={`/edukasi/${m.slug}`}
            className="rounded-2xl border-2 border-violet-100 border-t-4 border-t-violet-600 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-violet-900">{m.judul}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-slate-600">{m.intro}</p>
            <span className="mt-3 inline-block text-sm font-bold text-violet-700">
              Baca materi →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
