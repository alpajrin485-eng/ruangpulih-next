"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Foto = { foto_url: string; caption: string | null };

export default function Carousel() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [idx, setIdx] = useState(0);
  const [jeda, setJeda] = useState(false);

  useEffect(() => {
    createClient()
      .from("carousel")
      .select("foto_url,caption")
      .eq("aktif", true)
      .order("urutan")
      .limit(5)
      .then(({ data }) => setFotos((data as Foto[]) ?? []));
  }, []);

  useEffect(() => {
    if (fotos.length < 2 || jeda) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length, jeda]);

  if (fotos.length === 0) return null;

  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl shadow-lg ring-2 ring-violet-100"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
    >
      <div className="relative aspect-[21/9] w-full bg-violet-100">
        {fotos.map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={f.foto_url}
            alt={f.caption ?? `Foto ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {fotos[idx]?.caption && (
          <p className="absolute bottom-10 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-2 pt-8 text-center font-semibold text-white">
            {fotos[idx].caption}
          </p>
        )}
      </div>
      {fotos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((idx - 1 + fotos.length) % fotos.length)}
            aria-label="Sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1.5 font-bold text-violet-800 shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={() => setIdx((idx + 1) % fotos.length)}
            aria-label="Berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1.5 font-bold text-violet-800 shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {fotos.map((_, i) => (
              <button
                key={i}
                aria-label={`Foto ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
