// Uji Tahap 5. Jalankan: node scripts/e2e_tahap5.mjs (data tes dibersihkan otomatis)
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(URL, SVC, { auth: { persistSession: false } });
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
const login = async (email) => {
  const c = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw error;
  return c;
};

const uidU = await buatAkun("e5_user", "user");
const uidK = await buatAkun("e5_konselor", "konselor");
await admin.from("counselors").insert({ user_id: uidK, spesialisasi: "Tes", aktif: true });
const U = await login("e5_user@ruangpulih.local");

// 1. Blok A: materi admin terbaca (RLS publik)
await admin.from("study_materials").insert([
  { judul: "Tes Materi A1", deskripsi: "Deskripsi", link: "https://example.com", urutan: 0, aktif: true },
  { judul: "Tes Materi A2", deskripsi: null, link: null, urutan: 1, aktif: true },
]);
{
  const anon = createClient(URL, PUB, { auth: { persistSession: false } });
  const { data, error } = await anon.from("study_materials").select("judul").eq("aktif", true).order("urutan");
  cek("1. Blok A terbaca publik", !error && (data ?? []).length >= 2);
}
// 2. Blok B: followup selesai+diisi terbaca user; checklist update milik sendiri
const { data: kid } = await admin.from("counselors").select("id").eq("user_id", uidK).single();
const { data: ses } = await admin.from("sessions").insert({
  user_id: uidU, counselor_id: kid.id, keluhan: "Uji", status: "selesai",
}).select("id").single();
await admin.from("followups").insert({
  session_id: ses.id, materi_custom: "Materi X", plan: "Plan Y",
  focus_minutes: 20, rest_minutes: 10, sudah_diisi: true,
});
{
  const { data, error } = await U.from("followups")
    .select("id,materi_custom,plan,focus_minutes,sessions!inner(user_id,status)")
    .eq("sessions.user_id", uidU).eq("sessions.status", "selesai").eq("sudah_diisi", true);
  cek("2. Blok B kondisional terbaca", !error && (data ?? []).length === 1 && data[0].plan === "Plan Y");
  const fid = data[0].id;
  const up = await U.from("followups").update({ selesai_oleh_user: true }).eq("id", fid);
  const { data: cek2 } = await U.from("followups").select("selesai_oleh_user").eq("id", fid).single();
  cek("3. checklist user", !up.error && cek2?.selesai_oleh_user === true);
}
// 4. Timer manual tersimpan + terbaca
{
  await U.from("user_settings").upsert({ user_id: uidU, focus_minutes: 30, rest_minutes: 7 }, { onConflict: "user_id" });
  const { data } = await U.from("user_settings").select("focus_minutes,rest_minutes").eq("user_id", uidU).single();
  cek("4. preferensi timer", data?.focus_minutes === 30 && data?.rest_minutes === 7);
}
// 5. Carousel: insert 2 foto tes → anon baca limit 5
await admin.from("carousel").insert([
  { foto_url: "https://picsum.photos/seed/rp1/1200/500", caption: "Tes 1", urutan: 0, aktif: true },
  { foto_url: "https://picsum.photos/seed/rp2/1200/500", caption: "Tes 2", urutan: 1, aktif: true },
]);
{
  const anon = createClient(URL, PUB, { auth: { persistSession: false } });
  const { data, error } = await anon.from("carousel").select("foto_url").eq("aktif", true).order("urutan").limit(5);
  cek("5. carousel publik", !error && (data ?? []).length >= 2);
}
// 6. Settings nada terbaca publik
{
  const anon = createClient(URL, PUB, { auth: { persistSession: false } });
  const { data, error } = await anon.from("settings").select("key").in("key", ["default_focus", "alarm_url"]);
  cek("6. settings publik", !error && (data ?? []).length === 2);
}

// Cleanup
await admin.from("carousel").delete().like("foto_url", "%picsum%");
await admin.from("study_materials").delete().like("judul", "Tes Materi%");
await admin.from("followups").delete().eq("session_id", ses.id);
await admin.from("sessions").delete().eq("id", ses.id);
await admin.from("counselors").delete().eq("user_id", uidK);
await admin.from("user_settings").delete().eq("user_id", uidU);
for (const id of [uidU, uidK]) await admin.auth.admin.deleteUser(id);
console.log("cleanup selesai — data uji bersih");
