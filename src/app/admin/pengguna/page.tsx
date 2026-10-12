"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nilaiPassword, wajibKuat } from "@/lib/password";
import PasswordMeter from "@/components/password-meter";

type User = { id: string; username: string; nama: string | null; role: string; status: string };

export default function Pengguna() {
  const [list, setList] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ username: "", password: "", nama: "", spesialisasi: "", bio: "" });
  const [resetId, setResetId] = useState("");
  const [resetPw, setResetPw] = useState("");
  const input = "w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400";

  async function muat() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id,username,nama,role,status").order("username");
    setList((data as User[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
  }, []);

  async function tambahKonselor() {
    const cek = wajibKuat(f.password, f.username);
    if (cek) {
      setMsg(cek);
      return;
    }
    const r = await fetch("/api/admin/konselor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const j = await r.json();
    setMsg(r.ok ? "Akun konselor dibuat." : j.error ?? "Gagal.");
    if (r.ok) {
      setF({ username: "", password: "", nama: "", spesialisasi: "", bio: "" });
      muat();
    }
  }

  async function kirimReset() {
    if (!resetId) {
      setMsg("Pilih user terlebih dahulu.");
      return;
    }
    const cek = wajibKuat(resetPw);
    if (cek) {
      setMsg(cek);
      return;
    }
    const r = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: resetId, password: resetPw }),
    });
    const j = await r.json();
    setMsg(r.ok ? "Password direset." : j.error ?? "Gagal.");
    setResetPw("");
  }

  async function ubah(id: string, patch: Partial<User>) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setMsg(error ? "Gagal: " + error.message : "Tersimpan.");
    muat();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-violet-950">Pengguna</h1>
      {msg && <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">{msg}</p>}

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Tambah Konselor</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="Username" className={input} />
          <input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Nama" className={input} />
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Password (min 8, harus Kuat)" className={input} />
          <div className="md:col-span-3"><PasswordMeter value={f.password} username={f.username} /></div>
          <input value={f.spesialisasi} onChange={(e) => setF({ ...f, spesialisasi: e.target.value })} placeholder="Spesialisasi" className={input} />
          <input value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Bio singkat" className={input} />
          <button onClick={tambahKonselor} disabled={f.password !== "" && nilaiPassword(f.password, f.username).level !== "kuat"} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Buat Akun</button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Reset Password</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <select value={resetId} onChange={(e) => setResetId(e.target.value)} className={input + " md:w-64"}>
            <option value="">-- pilih user --</option>
            {list.map((u) => (
              <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
            ))}
          </select>
          <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="Password baru (min 8, Kuat)" className={input + " md:w-56"} />
          <button onClick={kirimReset} disabled={resetPw !== "" && nilaiPassword(resetPw).level !== "kuat"} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Reset</button>
        </div>
        {resetPw && <div className="mt-2 md:w-96"><PasswordMeter value={resetPw} /></div>}
      </section>

      <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-violet-50 text-left text-violet-900">
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Peran</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2 font-semibold">{u.username}</td>
                <td className="px-4 py-2">
                  <select value={u.role} onChange={(e) => ubah(u.id, { role: e.target.value })} className="rounded-lg border px-2 py-1">
                    {["user", "konselor", "admin"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={u.status} onChange={(e) => ubah(u.id, { status: e.target.value })} className="rounded-lg border px-2 py-1">
                    {["aktif", "diperingatkan", "dibanned"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-slate-400">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
