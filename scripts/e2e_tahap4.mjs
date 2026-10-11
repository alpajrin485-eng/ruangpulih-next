// Uji E2E Tahap 4. Jalankan: node scripts/e2e_tahap4.mjs (data tes dibersihkan otomatis)
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
  await admin.from("profiles").upsert({ id: data.user.id, username, nama: username, role, status: "aktif" }, { onConflict: "id" });
  return data.user.id;
}
const sess = () => createClient(URL, PUB, { auth: { persistSession: false } });

const uidU = await buatAkun("e2e_user", "user");
const uidK = await buatAkun("e2e_konselor", "konselor");
await admin.from("counselors").insert({ user_id: uidK, spesialisasi: "Tes", bio: "Akun uji", aktif: true });
const uidX = await buatAkun("e2e_oranglain", "user");

const login = async (email) => {
  const c = sess();
  const { error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw error;
  return c;
};
const U = await login("e2e_user@ruangpulih.local");
const K = await login("e2e_konselor@ruangpulih.local");
const X = await login("e2e_oranglain@ruangpulih.local");

// 1. Daftar konselor terbaca user (butuh migrasi 0003)
{
  const { data, error } = await U.from("counselors").select("id,profiles(username)").eq("aktif", true);
  cek("1. daftar konselor + nama", !error && (data ?? []).some((k) => k.profiles?.username === "e2e_konselor"));
}
// 2. User ajukan sesi
let sesiId = "";
{
  const { data, error } = await U.from("sessions").insert({
    user_id: uidU,
    counselor_id: (await U.from("counselors").select("id").eq("user_id", uidK).single()).data.id,
    keluhan: "Uji cemas ujian",
  }).select("id").single();
  cek("2. ajukan sesi", !error && !!data?.id);
  sesiId = data.id;
}
// 3. Konselor lihat + terima
{
  const { data } = await K.from("sessions").select("id").eq("id", sesiId);
  const { error } = await K.from("sessions").update({ status: "diterima" }).eq("id", sesiId);
  cek("3. konselor lihat & terima", (data ?? []).length === 1 && !error);
}
// 4. Chat dua arah terbaca masing-masing
{
  await U.from("messages").insert({ session_id: sesiId, sender_id: uidU, isi: "Halo, saya cemas" });
  await K.from("messages").insert({ session_id: sesiId, sender_id: uidK, isi: "Ceritakan lebih lanjut" });
  const mu = await U.from("messages").select("isi").eq("session_id", sesiId).order("created_at");
  const mk = await K.from("messages").select("isi").eq("session_id", sesiId).order("created_at");
  cek("4. chat dua arah", (mu.data ?? []).length === 2 && (mk.data ?? []).length === 2);
}
// 5. Isolasi: orang lain tak bisa baca
{
  const { data } = await X.from("sessions").select("id").eq("id", sesiId);
  const { data: mx } = await X.from("messages").select("id").eq("session_id", sesiId);
  cek("5. isolasi sesi & pesan", (data ?? []).length === 0 && (mx ?? []).length === 0);
}
// 6. Followup konselor
{
  const { error } = await K.from("followups").upsert({
    session_id: sesiId, materi_custom: "Materi napas", plan: "Latihan 5 menit",
    focus_minutes: 20, rest_minutes: 10, sudah_diisi: true,
  }, { onConflict: "session_id" });
  const { data } = await U.from("followups").select("plan").eq("session_id", sesiId);
  cek("6. followup konselor→user", !error && (data ?? [])[0]?.plan === "Latihan 5 menit");
}
// 7. Tutup + rating + rating ganda ditolak
{
  await U.from("sessions").update({ status: "selesai" }).eq("id", sesiId);
  const r1 = await U.from("ratings").insert({ session_id: sesiId, bintang: 5, ulasan: "Bagus" });
  const r2 = await U.from("ratings").insert({ session_id: sesiId, bintang: 1 });
  cek("7. rating sekali, ganda ditolak", !r1.error && !!r2.error);
}
// 8. Report user→konselor tercatat
{
  const { error } = await U.from("reports").insert({
    pelapor_id: uidU, terlapor_id: uidK, session_id: sesiId,
    arah: "user_ke_konselor", kategori: "Spam", bukti: "Uji lapor",
  });
  const { data } = await U.from("reports").select("id").eq("session_id", sesiId);
  cek("8. report tercatat", !error && (data ?? []).length === 1);
}
// 9. Rata-rata rating via fungsi agregat (butuh migrasi 0004)
{
  const pub = sess();
  const { data, error } = await pub.rpc("counselor_rating_stats");
  const mine = (data ?? []).find((x) => x.avg >= 5);
  cek("9. rating agregat publik", !error && !!mine, JSON.stringify(data ?? []));
}

// Cleanup
await admin.from("reports").delete().eq("session_id", sesiId);
await admin.from("ratings").delete().eq("session_id", sesiId);
await admin.from("followups").delete().eq("session_id", sesiId);
await admin.from("messages").delete().eq("session_id", sesiId);
await admin.from("sessions").delete().eq("id", sesiId);
await admin.from("counselors").delete().eq("user_id", uidK);
for (const id of [uidU, uidK, uidX]) await admin.auth.admin.deleteUser(id);
console.log("cleanup selesai — data uji bersih");
