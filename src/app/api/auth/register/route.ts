import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function POST(req: Request) {
  let body: { username?: string; password?: string; nama?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data salah." }, { status: 400 });
  }
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const nama = (body.nama ?? username).trim().slice(0, 60);

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username 3-20 karakter: huruf kecil, angka, garis bawah." },
      { status: 400 }
    );
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password minimal 4 karakter." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);
  if (taken && taken.length > 0) {
    return NextResponse.json({ error: "Username sudah dipakai." }, { status: 409 });
  }

  const email = `${username}@ruangpulih.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, nama },
  });
  if (error || !data.user) {
    const msg =
      error?.message?.includes("already been registered") ||
      error?.message?.includes("already exists")
        ? "Username sudah dipakai."
        : "Pendaftaran gagal. Coba lagi.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Trigger DB membuat profil role=user; pastikan sinkron.
  await admin.from("profiles").upsert(
    { id: data.user.id, username, nama, role: "user", status: "aktif" },
    { onConflict: "id" }
  );
  return NextResponse.json({ ok: true });
}
