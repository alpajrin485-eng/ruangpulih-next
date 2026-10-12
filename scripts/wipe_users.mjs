// Wipe semua auth.users KECUALI admin. Jalankan: node scripts/wipe_users.mjs
// Profil + data turunan ikut ter-cascade (hasil, sesi, chat, rating, report, warnings).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await admin.auth.admin.listUsers();
if (error) throw error;
let hapus = 0;
for (const u of data.users) {
  if (u.email === "admin@ruangpulih.local") {
    console.log("lewati admin:", u.email);
    continue;
  }
  const { error: e } = await admin.auth.admin.deleteUser(u.id);
  if (e) console.log("GAGAL hapus", u.email, e.message);
  else {
    hapus++;
    console.log("dihapus:", u.email);
  }
}
const { data: sisa } = await admin.from("profiles").select("username,role");
console.log(`SELESAI — dihapus: ${hapus}, tersisa:`, JSON.stringify(sisa));
