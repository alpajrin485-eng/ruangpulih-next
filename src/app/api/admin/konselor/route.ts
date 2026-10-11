import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function wajibAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  return p?.role === "admin" ? supabase : null;
}

// POST {username, password, nama, spesialisasi, bio} → buat akun konselor
export async function POST(req: Request) {
  if (!(await wajibAdmin())) return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  const b = await req.json();
  const username = String(b.username ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  if (!/^[a-z0-9_]{3,20}$/.test(username) || password.length < 4)
    return NextResponse.json({ error: "Username/password tidak valid." }, { status: 400 });
  const admin = createAdminClient();
  const { data: taken } = await admin.from("profiles").select("id").eq("username", username).limit(1);
  if (taken && taken.length > 0) return NextResponse.json({ error: "Username dipakai." }, { status: 409 });
  const email = `${username}@ruangpulih.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { username, nama: b.nama ?? username },
  });
  if (error || !data.user) return NextResponse.json({ error: "Gagal membuat akun." }, { status: 400 });
  await admin.from("profiles").upsert(
    { id: data.user.id, username, nama: String(b.nama ?? username), role: "konselor", status: "aktif" },
    { onConflict: "id" }
  );
  await admin.from("counselors").insert({
    user_id: data.user.id,
    spesialisasi: String(b.spesialisasi ?? ""),
    bio: String(b.bio ?? ""),
    aktif: true,
  });
  return NextResponse.json({ ok: true });
}
