// Verifikasi final Blok B + timer preset (data tes dibersihkan otomatis)
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(SUPA_URL, SVC, { auth: { persistSession: false } });
const cek = (nama, ok, info = "") => console.log((ok ? "OK  " : "GAGAL") + " " + nama, info);

const pw = randomBytes(8).toString("hex");
async function buatAkun(username, role) {
  const email = `${username}@ruangpulih.local`;
  const { data: list } = await admin.auth.admin.listUsers();
  const lama = list.users.find((u) => u.email === email);
  if (lama) await admin.auth.admin.deleteUser(lama.id);
  const { data, error } = await admin.auth.admin.createUser({
    email, password: pw, email_confirm: true, user_metadata: { username },
  });
  if (error) throw error;
  await admin.from("profiles").upsert(
    { id: data.user.id, username, nama: username, role, status: "aktif" },
    { onConflict: "id" }
  );
  return data.user.id;
}

const uidU = await buatAkun("fin_user", "user");
const uidK = await buatAkun("fin_konselor", "konselor");
await admin.from("counselors").insert({ user_id: uidK, spesialisasi: "Tes", aktif: true });
const { data: kid } = await admin.from("counselors").select("id").eq("user_id", uidK).single();
const { data: ses } = await admin.from("sessions").insert({
  user_id: uidU, counselor_id: kid.id, keluhan: "Final", status: "selesai",
}).select("id").single();
await admin.from("followups").insert({
  session_id: ses.id, materi_custom: "Materi final", plan: "Plan final",
  focus_minutes: 20, rest_minutes: 10, sudah_diisi: true,
});

// Login sebagai user, jalankan query PERSIS seperti halaman teman-belajar
const U = createClient(SUPA_URL, PUB, { auth: { persistSession: false } });
await U.auth.signInWithPassword({ email: "fin_user@ruangpulih.local", password: pw });
const { data: fu, error } = await U.from("followups")
  .select("id,materi_custom,plan,focus_minutes,rest_minutes,selesai_oleh_user,sessions!inner(user_id,status,counselors(profiles(nama))))")
  .eq("sessions.user_id", uidU)
  .eq("sessions.status", "selesai")
  .eq("sudah_diisi", true)
  .order("created_at", { ascending: false })
  .limit(1);
cek("1. Blok B muncul untuk user", !error && (fu ?? []).length === 1 && fu[0].plan === "Plan final", error?.message ?? "");
cek("2. timer preset konselor", (fu ?? [])[0]?.focus_minutes === 20, JSON.stringify({ f: fu?.[0]?.focus_minutes, r: fu?.[0]?.rest_minutes }));

// Cleanup (cascade menghapus followup+session saat user dihapus)
for (const un of ["fin_user", "fin_konselor"]) {
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list.users.find((x) => x.email === `${un}@ruangpulih.local`);
  if (u) await admin.auth.admin.deleteUser(u.id);
}
const { data: sisa } = await admin.from("profiles").select("username,role");
console.log("cleanup selesai — tersisa:", JSON.stringify(sisa));
