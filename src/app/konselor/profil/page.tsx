import { createClient } from "@/lib/supabase/server";
import PasswordForm from "@/app/(user)/profil/password-form";

export const dynamic = "force-dynamic";

export default async function KonselorProfil() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,nama")
    .eq("id", user.user?.id ?? "")
    .single();
  const { data: k } = await supabase
    .from("counselors")
    .select("spesialisasi,bio,aktif")
    .eq("user_id", user.user?.id ?? "")
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-blue-950">Profil Konselor</h1>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <dl className="grid gap-2 text-slate-600 md:grid-cols-2">
          <div><dt className="text-sm text-slate-400">Nama</dt><dd className="font-bold text-slate-800">{profile?.nama}</dd></div>
          <div><dt className="text-sm text-slate-400">Username</dt><dd className="font-bold text-slate-800">{profile?.username}</dd></div>
          <div><dt className="text-sm text-slate-400">Spesialisasi</dt><dd className="font-bold text-slate-800">{k?.spesialisasi ?? "-"}</dd></div>
          <div><dt className="text-sm text-slate-400">Status</dt><dd className="font-bold text-slate-800">{k?.aktif ? "Aktif" : "Nonaktif"}</dd></div>
        </dl>
        {k?.bio && <p className="mt-3 text-sm text-slate-600">{k.bio}</p>}
      </div>
      <PasswordForm />
    </div>
  );
}
