"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError("Password tidak sama.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      let j: { error?: string } = {};
      try {
        j = await r.json();
      } catch {
        j = { error: "Server tidak merespons dengan benar. Coba lagi." };
      }
      if (!r.ok) {
        setError(j.error ?? "Pendaftaran gagal.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username.trim().toLowerCase()}@ruangpulih.local`,
        password,
      });
      if (error) {
        setError("Akun dibuat, tetapi login otomatis gagal. Silakan login manual.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 to-white px-6">
      <form
        onSubmit={daftar}
        className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-4xl font-bold text-white">
          Ψ
        </div>
        <h1 className="text-center text-2xl font-extrabold text-violet-950">Daftar Akun</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Buat akun pengguna untuk mulai belajar.
        </p>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}
        <label className="mb-1 block text-sm font-semibold">Username baru (min 3 karakter)</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          autoComplete="username"
        />
        <label className="mb-1 block text-sm font-semibold">Password (min 4 karakter)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          autoComplete="new-password"
        />
        <label className="mb-1 block text-sm font-semibold">Ulangi password</label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="mb-6 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          autoComplete="new-password"
        />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Buat Akun"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-violet-700">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
