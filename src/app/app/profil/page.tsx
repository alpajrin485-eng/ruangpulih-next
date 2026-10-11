import { createClient } from "@/lib/supabase/server";
import PasswordForm from "./password-form";

export const dynamic = "force-dynamic";

export default async function Profil() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,nama,role,status,created_at")
    .eq("id", data.user?.id ?? "")
    .single();
  const { data: warnings } = await supabase
    .from("warnings")
    .select("teks,ke_berapa,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-violet-950">Profil</h1>
      {profile?.status === "diperingatkan" && (
        <div className="rounded-2xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-200">
          Akun Anda memiliki peringatan dari admin. Lihat daftar di bawah dan jaga
          perilaku berkonsultasi Anda.
        </div>
      )}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <dl className="grid gap-2 text-slate-600 md:grid-cols-2">
          <div><dt className="text-sm text-slate-400">Username</dt><dd className="font-bold text-slate-800">{profile?.username}</dd></div>
          <div><dt className="text-sm text-slate-400">Nama</dt><dd className="font-bold text-slate-800">{profile?.nama}</dd></div>
          <div><dt className="text-sm text-slate-400">Peran</dt><dd className="font-bold text-slate-800">{profile?.role}</dd></div>
          <div><dt className="text-sm text-slate-400">Status</dt><dd className="font-bold text-slate-800">{profile?.status}</dd></div>
        </dl>
      </div>
      {warnings && warnings.length > 0 && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-bold text-violet-950">Riwayat Peringatan</h2>
          <ul className="mt-2 space-y-2 text-slate-600">
            {warnings.map((w, i) => (
              <li key={i} className="rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-100">
                <b>Peringatan ke-{w.ke_berapa}:</b> {w.teks}
              </li>
            ))}
          </ul>
        </div>
      )}
      <PasswordForm />
    </div>
  );
}
