import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { wajibKuat } from "@/lib/password";

// POST {user_id, password} → reset password user (khusus admin)
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (p?.role !== "admin") return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  const b = await req.json();
  const cek = wajibKuat(String(b.password ?? ""));
  if (cek) return NextResponse.json({ error: cek }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(String(b.user_id), { password: String(b.password) });
  if (error) return NextResponse.json({ error: "Gagal reset password." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
