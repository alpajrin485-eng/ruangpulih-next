import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackToTop from "./back-to-top";

const DEFAULT_FOOTER: Record<string, string> = {
  footer_wa: "0851-0000-0000",
  footer_web: "www.ruangpulih.id",
  footer_email: "halo@ruangpulih.id",
  footer_alamat: "Jakarta, Indonesia",
  footer_copyright: "RuangPulih. All Rights Reserved.",
};

function Ikon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const SOSMED = [
  { key: "footer_yt", nama: "YouTube", d: "M23 12s0-3.9-.5-5.6c-.3-1-1.1-1.8-2.1-2C18.6 4 12 4 12 4s-6.6 0-8.4.4c-1 .3-1.8 1-2.1 2C1 8.1 1 12 1 12s0 3.9.5 5.6c.3 1 1.1 1.8 2.1 2 1.8.4 8.4.4 8.4.4s6.6 0 8.4-.4c-1 0 0 0 0 0-1-.3-1.8-1-2.1-2-.5-1.7-.5-5.6-.5-5.6zM9.8 15.5v-7l6 3.5-6 3.5z" },
  { key: "footer_fb", nama: "Facebook", d: "M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.8V14h2.7v8h3z" },
  { key: "footer_ig", nama: "Instagram", d: "M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 3.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.4 1.4 0 1 0 0-2.9 1.4 1.4 0 0 0 0 2.9z" },
  { key: "footer_tiktok", nama: "TikTok", d: "M16.6 3c.4 2.2 1.8 3.6 4.1 3.8v3c-1.6 0-3-.5-4.1-1.3v6.4c0 3.6-2.6 6.1-6 6.1-3.3 0-5.9-2.6-5.9-5.9 0-3.4 2.7-6 6.2-5.8v3.1c-1.7-.3-3.1 1-3.1 2.7 0 1.6 1.2 2.8 2.8 2.8 1.7 0 2.9-1.2 2.9-3V3h3.1z" },
  { key: "footer_x", nama: "X", d: "M17.7 3H21l-7.3 8.3L22.2 21h-6.7l-5.2-6.2L4.4 21H1l7.8-8.9L1.8 3h6.9l4.7 5.7L17.7 3zm-1.2 16h1.9L6.6 4.9H4.6L16.5 19z" },
];

export default async function Footer() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key,value").like("key", "footer\\_%");
  const nilai: Record<string, string> = { ...DEFAULT_FOOTER };
  (data ?? []).forEach((r: { key: string; value: string | null }) => {
    if (r.value) nilai[r.key] = r.value;
  });
  const tahun = new Date().getFullYear();

  return (
    <>
      <div className="h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500" />
      <footer className="bg-blue-950 text-blue-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 text-4xl font-bold text-blue-900 ring-4 ring-amber-200">
                Ψ
              </span>
              <div className="border-l-2 border-blue-700 pl-4">
                <p className="font-extrabold leading-tight">RUANGPULIH</p>
                <p className="text-sm text-blue-200">Belajar Sehat, Tumbuh Hebat</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm font-semibold">
              <div className="space-y-2">
                <Link href="/kuis" className="block hover:text-amber-200"><span className="mr-2">▶</span>KUIS BELAJAR</Link>
                <Link href="/refleksi" className="block hover:text-amber-200"><span className="mr-2">▶</span>REFLEKSI DIRI</Link>
                <Link href="/edukasi" className="block hover:text-amber-200"><span className="mr-2">▶</span>EDUKASI PSIKOLOGI</Link>
              </div>
              <div className="space-y-2">
                <Link href="/konsultasi" className="block hover:text-amber-200"><span className="mr-2">▶</span>KONSULTASI</Link>
                <Link href="/teman-belajar" className="block hover:text-amber-200"><span className="mr-2">▶</span>TEMAN BELAJAR</Link>
                <Link href="/tentang" className="block hover:text-amber-200"><span className="mr-2">▶</span>TENTANG KAMI</Link>
              </div>
            </div>
          </div>
          <div>
            <div className="flex gap-3">
              {SOSMED.map((s) => (
                <a key={s.nama} href={nilai[s.key] || "#"} target={nilai[s.key] ? "_blank" : undefined} rel="noreferrer" aria-label={s.nama} title={s.nama} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-900 hover:bg-amber-200">
                  <Ikon d={s.d} />
                </a>
              ))}
            </div>
            <p className="mt-5 font-extrabold">RuangPulih</p>
            <p className="text-sm text-blue-200">{nilai.footer_alamat}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><span className="font-semibold">Whatsapp</span><span className="mx-2">:</span>{nilai.footer_wa}</li>
              <li><span className="font-semibold">Website</span><span className="mx-2">:</span>{nilai.footer_web}</li>
              <li><span className="font-semibold">Email</span><span className="mx-2">:</span>{nilai.footer_email}</li>
            </ul>
            <p className="mt-5 text-sm text-blue-200">
              Copyright © {tahun} {nilai.footer_copyright} Disclaimer
            </p>
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
