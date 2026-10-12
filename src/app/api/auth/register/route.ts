import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { wajibKuat } from "@/lib/password";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("register: env Supabase belum dikonfigurasi");
      return NextResponse.json({ error: "Layanan pendaftaran belum siap. Hubungi admin." }, { status: 500 });
    }
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
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    const cek = wajibKuat(password, username);
    if (cek) {
      return NextResponse.json({ error: cek }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: taken, error: cekErr } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1);
    if (cekErr) {
      console.error("register: cek username gagal", cekErr.message);
      return NextResponse.json({ error: "Pendaftaran gagal. Coba lagi." }, { status: 500 });
    }
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
    const { error: upErr } = await admin.from("profiles").upsert(
      { id: data.user.id, username, nama, role: "user", status: "aktif" },
      { onConflict: "id" }
    );
    if (upErr) {
      console.error("register: sinkron profil gagal", upErr.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("register: error tak terduga", e);
    return NextResponse.json({ error: "Pendaftaran gagal. Coba lagi." }, { status: 500 });
  }
}
