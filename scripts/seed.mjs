// Seed data lama (Streamlit) -> Supabase. Jalankan: node scripts/seed.mjs
// Butuh: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di .env.local
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv(".env.local");
const OLD = "../ruangpulih";
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const j = (p) => JSON.parse(readFileSync(`${OLD}/${p}`, "utf8"));

// ---------- 1. Users ----------
const oldUsers = [
  { username: "admin", role: "admin", password: "admin123", email: "admin@ruangpulih.local" },
  { username: "yanto", role: "user", password: randomBytes(12).toString("hex"), email: "yanto@ruangpulih.local" },
  { username: "ojik", role: "user", password: randomBytes(12).toString("hex"), email: "ojik@ruangpulih.local" },
];
const ids = {};
for (const u of oldUsers) {
  const { data: list } = await sb.auth.admin.listUsers();
  let au = list.users.find((x) => x.email === u.email);
  if (!au) {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username, role: u.role },
    });
    if (error) throw error;
    au = data.user;
    console.log(`user dibuat: ${u.username}` + (u.username === "admin" ? " (pw: admin123)" : " (pw acak — reset manual)"));
  }
  ids[u.username] = au.id;
  const { error } = await sb.from("profiles").upsert(
    { id: au.id, username: u.username, nama: u.username, role: u.role, status: "aktif" },
    { onConflict: "id" }
  );
  if (error) throw error;
}

// ---------- 2. Quiz results (ojik) ----------
const tanggal = ["2026-10-11 23:00", "2026-10-11 23:11", "2026-10-11 23:21"];
const skor = [20, 100, 100];
for (let i = 0; i < 3; i++) {
  const { error } = await sb.from("quiz_results").insert({
    user_id: ids["ojik"],
    skor: skor[i],
    tanggal: new Date(tanggal[i].replace(" ", "T") + ":00").toISOString(),
    menonton: false,
  });
  if (error) throw error;
}
console.log("quiz_results: 3 baris");

// ---------- 3. Questions ----------
for (const [i, q] of j("assets/quiz.json").entries()) {
  const { error } = await sb.from("questions").insert({
    question: q.question, options: q.options, answer: q.answer,
    explanation: q.explanation, urutan: i, aktif: true,
  });
  if (error) throw error;
}
console.log("questions: 5 baris");

// ---------- 4. Materi ----------
for (const [i, m] of j("assets/materi.json").entries()) {
  const { error } = await sb.from("materi").insert({
    slug: m.id, judul: m.judul, intro: m.intro, isi: m.isi, urutan: i, aktif: true,
  });
  if (error) throw error;
}
console.log("materi: 4 baris");

// ---------- 5. Videos ----------
for (const v of j("assets/videos.json")) {
  const { error } = await sb.from("videos").insert({
    judul: v.judul, tipe: v.tipe, kind: v.kind, src: v.src, aktif: !!v.aktif,
  });
  if (error) throw error;
}
console.log("videos: 1 baris");

// ---------- 6. Settings ----------
for (const [k, v] of [["default_focus", "25"], ["default_rest", "5"], ["alarm_url", ""]]) {
  const { error } = await sb.from("settings").upsert({ key: k, value: v }, { onConflict: "key" });
  if (error) throw error;
}
console.log("settings: 3 baris");
console.log("SEED-SELESAI");
