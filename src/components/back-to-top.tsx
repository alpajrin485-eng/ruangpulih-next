"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [tampil, setTampil] = useState(false);
  useEffect(() => {
    const cek = () => setTampil(window.scrollY > 400);
    window.addEventListener("scroll", cek);
    return () => window.removeEventListener("scroll", cek);
  }, []);
  if (!tampil) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white shadow-lg ring-2 ring-green-300 hover:bg-green-700"
    >
      ↑
    </button>
  );
}
