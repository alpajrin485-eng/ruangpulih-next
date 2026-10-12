// Cek keterbacaan file carousel. Jalankan: node scripts/cek_carousel.mjs
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
const { data } = await admin.from("carousel").select("foto_url,caption,aktif").order("urutan");
for (const r of data ?? []) {
  try {
    const res = await fetch(r.foto_url, { method: "HEAD" });
    console.log(res.status, "aktif=" + r.aktif, (r.caption ?? "").slice(0, 25), r.foto_url.slice(-45));
  } catch (e) {
    console.log("GAGAL FETCH", (r.caption ?? "").slice(0, 25), String(e).slice(0, 80));
  }
}
