"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username.trim().toLowerCase()}@ruangpulih.local`,
        password,
      });
      if (error) {
        setError("Username atau password salah.");
        return;
      }
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
      return;
    } finally {
      setLoading(false);
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 to-white px-6">
      <form
        onSubmit={masuk}
        className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-4xl font-bold text-white">
          Ψ
        </div>
        <h1 className="text-center text-2xl font-extrabold text-violet-950">Login</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Masuk untuk mulai belajar dan melihat progres Anda.
        </p>
        {params.get("banned") === "1" && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            Akun dinonaktifkan permanen. Hubungi admin untuk informasi.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}
        <label className="mb-1 block text-sm font-semibold">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          autoComplete="username"
        />
        <label className="mb-1 block text-sm font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
          autoComplete="current-password"
        />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow disabled:opacity-60"
        >
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-violet-700">
            Daftar sekarang
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
