"use client";

import { nilaiPassword, type Level } from "@/lib/password";

const WARNA: Record<Level, string> = { lemah: "bg-red-500", sedang: "bg-amber-400", kuat: "bg-green-500" };
const TEKS: Record<Level, string> = { lemah: "text-red-600", sedang: "text-amber-600", kuat: "text-green-600" };
const LABEL: Record<Level, string> = { lemah: "Lemah", sedang: "Sedang", kuat: "Kuat" };

export default function PasswordMeter({ value, username = "" }: { value: string; username?: string }) {
  if (!value) return null;
  const n = nilaiPassword(value, username);
  return (
    <div className="mt-1">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${WARNA[n.level]} transition-all`} style={{ width: `${(n.skor / 4) * 100}%` }} />
      </div>
      <p className={`mt-1 text-xs font-bold ${TEKS[n.level]}`}>{LABEL[n.level]}</p>
      {n.alasan.length > 0 && <p className="text-xs text-slate-500">{n.alasan.join("; ")}.</p>}
    </div>
  );
}
