"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function ganti(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (pw1 !== pw2) {
      setMsg("Password tidak sama.");
      return;
    }
    if (pw1.length < 4) {
      setMsg("Password minimal 4 karakter.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);
    setMsg(error ? "Gagal mengganti password." : "Password berhasil diganti.");
    if (!error) {
      setPw1("");
      setPw2("");
    }
  }

  return (
    <form onSubmit={ganti} className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="font-bold text-violet-950">Ganti Password</h2>
      {msg && <p className="mt-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-900">{msg}</p>}
      <label className="mb-1 mt-4 block text-sm font-semibold">Password baru</label>
      <input
        type="password"
        value={pw1}
        onChange={(e) => setPw1(e.target.value)}
        className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
        autoComplete="new-password"
      />
      <label className="mb-1 mt-4 block text-sm font-semibold">Ulangi password baru</label>
      <input
        type="password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
        autoComplete="new-password"
      />
      <button
        disabled={loading}
        className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-bold text-white shadow disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Simpan Password"}
      </button>
    </form>
  );
}
