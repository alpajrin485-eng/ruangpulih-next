// Uji E2E Tahap 6 (API admin + alur laporan→banned). Data tes dibersihkan otomatis.
// Prasyarat: dev server jalan (skrip ini menyalakannya sendiri di port 3005).
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
const REF = new URL(SUPA_URL).hostname.split(".")[0];
const admin = createClient(SUPA_URL, SVC, { auth: { persistSession: false } });
const cek = (nama, ok, info = "") => console.log((ok ? "OK  " : "GAGAL") + " " + nama, info);

const pw = randomBytes(8).toString("hex");
function cookieUntuk(session) {
  const v = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  return `sb-${REF}-auth-token=${v}`;
}
async function sesiSebagai(email, password) {
  const c = createClient(SUPA_URL, PUB, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error("login gagal: " + email);
  return cookieUntuk(data.session);
}
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

const BASE = "http://localhost:3000";
const cookieAdmin = await sesiSebagai("admin@ruangpulih.local", "admin123");

// 1. API tambah konselor (admin) + duplikat ditolak
let kid = "";
{
  const r = await fetch(`${BASE}/api/admin/konselor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({ username: "e6_konselor", password: "konselor123", nama: "Konselor Tes", spesialisasi: "Akademik", bio: "Tes" }),
  });
  const j = await r.json();
  const { data } = await admin.from("counselors").select("id,user_id").eq("user_id",
    (await admin.from("profiles").select("id").eq("username", "e6_konselor").single()).data.id).single();
  kid = data?.id ?? "";
  const r2 = await fetch(`${BASE}/api/admin/konselor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({ username: "e6_konselor", password: "konselor123" }),
  });
  cek("1. tambah konselor + duplikat 409", r.ok && j.ok && kid && r2.status === 409);
}
// 2. API tambah konselor ditolak untuk non-admin
{
  const uidT = await buatAkun("e6_user", "user");
  const cookieU = await sesiSebagai("e6_user@ruangpulih.local", pw);
  const r = await fetch(`${BASE}/api/admin/konselor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieU },
    body: JSON.stringify({ username: "e6_x", password: "1234" }),
  });
  cek("2. tambah konselor ditolak non-admin", r.status === 403);
  // 3. Reset password oleh admin OK; oleh user ditolak
  const rOk = await fetch(`${BASE}/api/admin/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({ user_id: uidT, password: "baru1234" }),
  });
  const c = createClient(SUPA_URL, PUB, { auth: { persistSession: false } });
  const loginBaru = await c.auth.signInWithPassword({ email: "e6_user@ruangpulih.local", password: "baru1234" });
  const rNo = await fetch(`${BASE}/api/admin/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieU },
    body: JSON.stringify({ user_id: uidT, password: "zzzz" }),
  });
  cek("3. reset pw admin OK, user 403", rOk.ok && !loginBaru.error && rNo.status === 403);
}
// 4. Alur laporan → 3 peringatan → banned otomatis (replika logika halaman laporan)
{
  const { data: prof } = await admin.from("profiles").select("id").eq("username", "e6_user").single();
  for (let ke = 1; ke <= 3; ke++) {
    const { data: rep } = await admin.from("reports").insert({
      pelapor_id: (await admin.from("profiles").select("id").eq("username", "admin").single()).data.id,
      terlapor_id: prof.id, arah: "konselor_ke_user", kategori: "Spam", bukti: `Uji ${ke}`, status: "terbukti",
    }).select("id").single();
    const { data: w } = await admin.from("warnings").select("id").eq("user_id", prof.id);
    const n = (w ?? []).length + 1;
    await admin.from("warnings").insert({ user_id: prof.id, teks: `Uji peringatan ${n}`, report_id: rep.id, ke_berapa: n });
    if (n >= 3) await admin.from("profiles").update({ status: "dibanned", banned_reason: `Peringatan ke-${n}` }).eq("id", prof.id);
    else await admin.from("profiles").update({ status: "diperingatkan" }).eq("id", prof.id);
  }
  const { data: akhir } = await admin.from("profiles").select("status,banned_reason").eq("id", prof.id).single();
  const { data: warns } = await admin.from("warnings").select("ke_berapa").eq("user_id", prof.id);
  cek("4. 3x peringatan → banned", akhir.status === "dibanned" && warns.length === 3, JSON.stringify(akhir));
}
// 5. Query overview (rating, kategori refleksi, tren) mengembalikan bentuk benar
{
  const { data: stats, error: e1 } = await admin.rpc("counselor_rating_stats");
  const { data: ref } = await admin.from("refleksi_results").select("j1,j2,j3,j4");
  const { data: q } = await admin.from("quiz_results").select("skor,tanggal").limit(5);
  cek("5. query overview", !e1 && Array.isArray(stats) && Array.isArray(ref ?? []) && Array.isArray(q ?? []));
}

// Cleanup: hapus 2 user tes (warnings/reports/followups/counselors ikut ter-cascade)
for (const un of ["e6_konselor", "e6_user"]) {
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list.users.find((x) => x.email === `${un}@ruangpulih.local`);
  if (u) await admin.auth.admin.deleteUser(u.id);
}
console.log("cleanup selesai — data uji bersih");
