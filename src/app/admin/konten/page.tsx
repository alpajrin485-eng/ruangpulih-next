"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const KAT = ["prokrastinasi", "burnout", "stres", "istirahat"];
const input = "w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400";
const btn = "rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow";
const btnGhost = "rounded-xl px-4 py-2 text-sm font-bold text-slate-500 ring-1 ring-slate-200";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `materi-${Date.now()}`;
}

export default function Konten() {
  const [tab, setTab] = useState("Kuis");
  const [msg, setMsg] = useState("");
  const supabase = createClient();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-violet-950">Kelola Konten</h1>
      <div className="flex flex-wrap gap-2">
        {["Kuis", "Edukasi", "Video", "Carousel", "Nada", "Materi Belajar", "Footer"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setMsg(""); }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-200"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">{msg}</p>}
      {tab === "Kuis" && <TabKuis supabase={supabase} kabari={setMsg} />}
      {tab === "Edukasi" && <TabEdukasi supabase={supabase} kabari={setMsg} />}
      {tab === "Video" && <TabVideo supabase={supabase} kabari={setMsg} />}
      {tab === "Carousel" && <TabCarousel supabase={supabase} kabari={setMsg} />}
      {tab === "Nada" && <TabNada supabase={supabase} kabari={setMsg} />}
      {tab === "Materi Belajar" && <TabMateriBelajar supabase={supabase} kabari={setMsg} />}
      {tab === "Footer" && <TabFooter supabase={supabase} kabari={setMsg} />}
    </div>
  );
}

type SB = ReturnType<typeof createClient>;

async function hapusBerkas(supabase: SB, bucket: string, publicUrl: string | null) {
  if (!publicUrl) return;
  const i = publicUrl.indexOf(`/${bucket}/`);
  if (i < 0) return;
  const path = publicUrl.slice(i + bucket.length + 2);
  if (path) await supabase.storage.from(bucket).remove([path]);
}

// ---------------- KUIS ----------------
function TabKuis({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  type Q = { id: string; question: string; options: string[]; answer: number; explanation: string; kategori: string; aktif: boolean };
  const [list, setList] = useState<Q[]>([]);
  const [f, setF] = useState({ question: "", o0: "", o1: "", o2: "", o3: "", answer: 0, explanation: "", kategori: KAT[0] });
  const [edit, setEdit] = useState<string | null>(null);

  async function muat() {
    const { data } = await supabase.from("questions").select("*").order("urutan");
    setList((data as Q[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function valid() {
    return f.question.trim() && f.o0.trim() && f.o1.trim() && f.o2.trim() && f.o3.trim() && f.explanation.trim();
  }
  async function simpan() {
    if (!valid()) {
      kabari("Lengkapi pertanyaan, 4 opsi, dan penjelasan.");
      return;
    }
    const row = { question: f.question.trim(), options: [f.o0.trim(), f.o1.trim(), f.o2.trim(), f.o3.trim()], answer: f.answer, explanation: f.explanation.trim(), kategori: f.kategori };
    const { error } = edit
      ? await supabase.from("questions").update(row).eq("id", edit)
      : await supabase.from("questions").insert({ ...row, urutan: list.length, aktif: true });
    kabari(error ? "Gagal menyimpan: " + error.message : "Soal tersimpan.");
    setEdit(null);
    setF({ question: "", o0: "", o1: "", o2: "", o3: "", answer: 0, explanation: "", kategori: KAT[0] });
    muat();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">{edit ? "Ubah Soal" : "Tambah Soal"} ({list.length} soal)</h2>
      <textarea value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} placeholder="Pertanyaan" rows={2} className={input} />
      <div className="grid gap-2 md:grid-cols-2">
        {[f.o0, f.o1, f.o2, f.o3].map((v, i) => (
          <input key={i} value={v} onChange={(e) => setF({ ...f, [`o${i}`]: e.target.value } as typeof f)} placeholder={`Opsi ${"ABCD"[i]}`} className={input} />
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-sm">Jawaban benar
          <select value={f.answer} onChange={(e) => setF({ ...f, answer: parseInt(e.target.value) })} className={input}>
            {[0, 1, 2, 3].map((i) => <option key={i} value={i}>{"ABCD"[i]}</option>)}
          </select>
        </label>
        <label className="text-sm">Kategori
          <select value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })} className={input}>
            {KAT.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </div>
      <textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} placeholder="Penjelasan" rows={2} className={input} />
      <div className="flex gap-2">
        <button onClick={simpan} className={btn}>Simpan</button>
        {edit && <button onClick={() => { setEdit(null); setF({ question: "", o0: "", o1: "", o2: "", o3: "", answer: 0, explanation: "", kategori: KAT[0] }); }} className={btnGhost}>Batal</button>}
      </div>
      <ul className="space-y-2">
        {list.map((q, i) => (
          <li key={q.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm">
            <span><b>{i + 1}.</b> {q.question.slice(0, 70)} <span className="text-violet-600">[{q.kategori}]</span></span>
            <span className="flex gap-2">
              <button onClick={() => { setEdit(q.id); setF({ question: q.question, o0: q.options[0], o1: q.options[1], o2: q.options[2], o3: q.options[3], answer: q.answer, explanation: q.explanation, kategori: q.kategori ?? KAT[0] }); }} className="font-bold text-violet-700">Ubah</button>
              <button onClick={async () => { await supabase.from("questions").delete().eq("id", q.id); muat(); }} className="font-bold text-red-600">Hapus</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- EDUKASI ----------------
function TabEdukasi({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  type M = { id: string; slug: string; judul: string; intro: string | null; isi: string };
  const [list, setList] = useState<M[]>([]);
  const [f, setF] = useState({ judul: "", intro: "", isi: "" });
  const [edit, setEdit] = useState<string | null>(null);

  async function muat() {
    const { data } = await supabase.from("materi").select("id,slug,judul,intro,isi").order("urutan");
    setList((data as M[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function simpan() {
    if (!f.judul.trim() || !f.isi.trim()) {
      kabari("Judul dan isi wajib diisi.");
      return;
    }
    if (edit) {
      const { error } = await supabase.from("materi").update({ judul: f.judul.trim(), intro: f.intro.trim() || null, isi: f.isi }).eq("id", edit);
      kabari(error ? "Gagal: " + error.message : "Materi diperbarui.");
    } else {
      const slug = slugify(f.judul);
      const { data: ada } = await supabase.from("materi").select("id").eq("slug", slug).limit(1);
      const finalSlug = ada && ada.length > 0 ? `${slug}-${Date.now() % 100000}` : slug;
      const { error } = await supabase.from("materi").insert({ slug: finalSlug, judul: f.judul.trim(), intro: f.intro.trim() || null, isi: f.isi, urutan: list.length, aktif: true });
      kabari(error ? "Gagal: " + error.message : "Materi ditambahkan.");
    }
    setEdit(null);
    setF({ judul: "", intro: "", isi: "" });
    muat();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">{edit ? "Ubah Materi" : "Tambah Materi"} ({list.length})</h2>
      <input value={f.judul} onChange={(e) => setF({ ...f, judul: e.target.value })} placeholder="Judul" className={input} />
      <textarea value={f.intro} onChange={(e) => setF({ ...f, intro: e.target.value })} placeholder="Pengantar singkat" rows={2} className={input} />
      <textarea value={f.isi} onChange={(e) => setF({ ...f, isi: e.target.value })} placeholder="Isi (markdown didukung)" rows={8} className={input} />
      <div className="flex gap-2">
        <button onClick={simpan} className={btn}>Simpan</button>
        {edit && <button onClick={() => { setEdit(null); setF({ judul: "", intro: "", isi: "" }); }} className={btnGhost}>Batal</button>}
      </div>
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm">
            <span><b>{m.judul}</b> <span className="text-slate-400">/{m.slug}</span></span>
            <span className="flex gap-2">
              <button onClick={() => { setEdit(m.id); setF({ judul: m.judul, intro: m.intro ?? "", isi: m.isi }); }} className="font-bold text-violet-700">Ubah</button>
              <button onClick={async () => { await supabase.from("materi").delete().eq("id", m.id); muat(); }} className="font-bold text-red-600">Hapus</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- VIDEO ----------------
function TabVideo({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  type V = { id: string; judul: string; tipe: string; kind: string; src: string; aktif: boolean };
  const [list, setList] = useState<V[]>([]);
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState("edukasi");
  const [file, setFile] = useState<File | null>(null);
  const [yt, setYt] = useState({ judul: "", tipe: "edukasi", url: "" });
  const [kerja, setKerja] = useState(false);

  async function muat() {
    const { data } = await supabase.from("videos").select("*").order("tipe");
    setList((data as V[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function nonaktifkanLain(t: string) {
    await supabase.from("videos").update({ aktif: false }).eq("tipe", t);
  }

  async function unggah() {
    if (!judul.trim() || !file) {
      kabari("Isi judul dan pilih berkas dulu.");
      return;
    }
    setKerja(true);
    const nama = `${tipe}_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("video").upload(nama, file, { upsert: true });
    if (upErr) {
      kabari("Upload gagal: " + upErr.message);
      setKerja(false);
      return;
    }
    const { data } = supabase.storage.from("video").getPublicUrl(nama);
    await nonaktifkanLain(tipe);
    const { error } = await supabase.from("videos").insert({ judul: judul.trim(), tipe, kind: "file", src: data.publicUrl, aktif: true });
    kabari(error ? "Gagal simpan: " + error.message : "Video diunggah dan diaktifkan.");
    setJudul("");
    setFile(null);
    setKerja(false);
    muat();
  }

  async function simpanYt() {
    if (!yt.judul.trim() || !yt.url.includes("youtu")) {
      kabari("Isi judul dan tautan YouTube yang valid.");
      return;
    }
    await nonaktifkanLain(yt.tipe);
    const { error } = await supabase.from("videos").insert({ judul: yt.judul.trim(), tipe: yt.tipe, kind: "youtube", src: yt.url.trim(), aktif: true });
    kabari(error ? "Gagal: " + error.message : "Tautan tersimpan dan diaktifkan.");
    setYt({ judul: "", tipe: "edukasi", url: "" });
    muat();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">Unggah Berkas Video</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul" className={input} />
        <select value={tipe} onChange={(e) => setTipe(e.target.value)} className={input}>
          <option value="edukasi">Edukasi</option>
          <option value="motivasi">Motivasi</option>
        </select>
        <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={input} />
      </div>
      <button onClick={unggah} disabled={kerja} className={btn}>{kerja ? "Mengunggah..." : "Unggah & Aktifkan"}</button>
      <h2 className="pt-2 font-bold">Atau Tautan YouTube</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input value={yt.judul} onChange={(e) => setYt({ ...yt, judul: e.target.value })} placeholder="Judul" className={input} />
        <select value={yt.tipe} onChange={(e) => setYt({ ...yt, tipe: e.target.value })} className={input}>
          <option value="edukasi">Edukasi</option>
          <option value="motivasi">Motivasi</option>
        </select>
        <input value={yt.url} onChange={(e) => setYt({ ...yt, url: e.target.value })} placeholder="https://youtube..." className={input} />
      </div>
      <button onClick={simpanYt} className={btn}>Simpan Tautan</button>
      <ul className="space-y-2">
        {list.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm">
            <span><b>[{v.tipe}]</b> {v.judul} <span className="text-slate-400">({v.kind}{v.aktif ? ", aktif" : ""})</span></span>
            <button onClick={async () => { if (v.kind === "file") await hapusBerkas(supabase, "video", v.src); await supabase.from("videos").delete().eq("id", v.id); muat(); }} className="font-bold text-red-600">Hapus</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- CAROUSEL ----------------
function TabCarousel({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  type C = { id: string; foto_url: string; caption: string | null; urutan: number; aktif: boolean };
  const [list, setList] = useState<C[]>([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [kerja, setKerja] = useState(false);

  async function muat() {
    const { data } = await supabase.from("carousel").select("*").order("urutan");
    setList((data as C[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unggah() {
    if (!file) {
      kabari("Pilih foto dulu (maks 5 aktif tampil).");
      return;
    }
    setKerja(true);
    const nama = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("carousel").upload(nama, file, { upsert: true });
    if (upErr) {
      kabari("Upload gagal: " + upErr.message);
      setKerja(false);
      return;
    }
    const { data } = supabase.storage.from("carousel").getPublicUrl(nama);
    const { error } = await supabase.from("carousel").insert({ foto_url: data.publicUrl, caption: caption.trim() || null, urutan: list.length, aktif: true });
    kabari(error ? "Gagal: " + error.message : "Foto ditambahkan.");
    setCaption("");
    setFile(null);
    setKerja(false);
    muat();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">Foto Carousel ({list.filter((c) => c.aktif).length} aktif, maks tampil 5)</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={input} />
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (opsional)" className={input} />
        <button onClick={unggah} disabled={kerja} className={btn}>{kerja ? "Mengunggah..." : "Tambah Foto"}</button>
      </div>
      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm">
            <span className="truncate">{c.caption || c.foto_url.slice(0, 60)} {c.aktif ? "" : "(nonaktif)"}</span>
            <span className="flex gap-2">
              <button onClick={async () => { await supabase.from("carousel").update({ aktif: !c.aktif }).eq("id", c.id); muat(); }} className="font-bold text-violet-700">{c.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
              <button onClick={async () => { await hapusBerkas(supabase, "carousel", c.foto_url); await supabase.from("carousel").delete().eq("id", c.id); muat(); }} className="font-bold text-red-600">Hapus</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- NADA ----------------
function TabNada({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  const [saatIni, setSaatIni] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [kerja, setKerja] = useState(false);

  async function muat() {
    const { data } = await supabase.from("settings").select("value").eq("key", "alarm_url").single();
    setSaatIni(data?.value ?? "");
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unggah() {
    if (!file) {
      kabari("Pilih berkas MP3 dulu.");
      return;
    }
    setKerja(true);
    const nama = `nada_${Date.now()}.mp3`;
    const { error: upErr } = await supabase.storage.from("media").upload(nama, file, { upsert: true });
    if (upErr) {
      kabari("Upload gagal: " + upErr.message);
      setKerja(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(nama);
    const lama = saatIni;
    await supabase.from("settings").upsert({ key: "alarm_url", value: data.publicUrl }, { onConflict: "key" });
    if (lama && lama !== data.publicUrl) await hapusBerkas(supabase, "media", lama);
    kabari("Nada alarm diperbarui.");
    setFile(null);
    setKerja(false);
    muat();
  }

  async function hapus() {
    const lama = saatIni;
    await supabase.from("settings").upsert({ key: "alarm_url", value: "" }, { onConflict: "key" });
    await hapusBerkas(supabase, "media", lama);
    kabari("Nada dihapus. Timer memakai bunyi bawaan browser.");
    muat();
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">Nada Alarm Timer</h2>
      <p className="text-sm text-slate-500">Saat ini: {saatIni ? <a href={saatIni} target="_blank" rel="noreferrer" className="font-bold text-violet-700">dengar MP3</a> : "bawaan browser"}</p>
      <div className="flex flex-wrap gap-2">
        <input type="file" accept="audio/mpeg,audio/mp3" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={input} />
        <button onClick={unggah} disabled={kerja} className={btn}>{kerja ? "Mengunggah..." : "Unggah MP3"}</button>
        {saatIni && <button onClick={hapus} className={btnGhost}>Kembali ke bawaan</button>}
      </div>
    </div>
  );
}

// ---------------- MATERI BELAJAR ----------------
function TabMateriBelajar({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  type M = { id: string; judul: string; deskripsi: string | null; link: string | null };
  const [list, setList] = useState<M[]>([]);
  const [f, setF] = useState({ judul: "", deskripsi: "", link: "" });
  const [edit, setEdit] = useState<string | null>(null);

  async function muat() {
    const { data } = await supabase.from("study_materials").select("id,judul,deskripsi,link").order("urutan");
    setList((data as M[]) ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function simpan() {
    if (!f.judul.trim()) {
      kabari("Judul wajib diisi.");
      return;
    }
    const row = { judul: f.judul.trim(), deskripsi: f.deskripsi.trim() || null, link: f.link.trim() || null };
    const { error } = edit
      ? await supabase.from("study_materials").update(row).eq("id", edit)
      : await supabase.from("study_materials").insert({ ...row, urutan: list.length, aktif: true });
    kabari(error ? "Gagal: " + error.message : "Tersimpan.");
    setEdit(null);
    setF({ judul: "", deskripsi: "", link: "" });
    muat();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">{edit ? "Ubah" : "Tambah"} Materi Teman Belajar ({list.length})</h2>
      <input value={f.judul} onChange={(e) => setF({ ...f, judul: e.target.value })} placeholder="Judul" className={input} />
      <textarea value={f.deskripsi} onChange={(e) => setF({ ...f, deskripsi: e.target.value })} placeholder="Deskripsi" rows={2} className={input} />
      <input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="Tautan (opsional)" className={input} />
      <div className="flex gap-2">
        <button onClick={simpan} className={btn}>Simpan</button>
        {edit && <button onClick={() => { setEdit(null); setF({ judul: "", deskripsi: "", link: "" }); }} className={btnGhost}>Batal</button>}
      </div>
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm">
            <span><b>{m.judul}</b></span>
            <span className="flex gap-2">
              <button onClick={() => { setEdit(m.id); setF({ judul: m.judul, deskripsi: m.deskripsi ?? "", link: m.link ?? "" }); }} className="font-bold text-violet-700">Ubah</button>
              <button onClick={async () => { await supabase.from("study_materials").delete().eq("id", m.id); muat(); }} className="font-bold text-red-600">Hapus</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- FOOTER ----------------
const FOOTER_KEYS: Array<[string, string]> = [
  ["footer_wa", "Whatsapp"],
  ["footer_web", "Website"],
  ["footer_email", "Email"],
  ["footer_alamat", "Alamat"],
  ["footer_copyright", "Teks copyright"],
  ["footer_yt", "YouTube (tautan)"],
  ["footer_fb", "Facebook (tautan)"],
  ["footer_ig", "Instagram (tautan)"],
  ["footer_tiktok", "TikTok (tautan)"],
  ["footer_x", "X (tautan)"],
];

function TabFooter({ supabase, kabari }: { supabase: SB; kabari: (s: string) => void }) {
  const [f, setF] = useState<Record<string, string>>({});

  async function muat() {
    const { data } = await supabase.from("settings").select("key,value").like("key", "footer\\_%");
    const m: Record<string, string> = {};
    ((data as Array<{ key: string; value: string | null }>) ?? []).forEach((r) => {
      m[r.key] = r.value ?? "";
    });
    setF(m);
  }
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function simpan() {
    for (const [k] of FOOTER_KEYS) {
      await supabase.from("settings").upsert({ key: k, value: (f[k] ?? "").trim() }, { onConflict: "key" });
    }
    kabari("Kontak footer tersimpan.");
    muat();
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-bold">Kontak Footer</h2>
      <p className="text-sm text-slate-500">Tampil di footer hijau bagian bawah web. Kosongkan untuk memakai bawaan.</p>
      {FOOTER_KEYS.map(([k, label]) => (
        <label key={k} className="block text-sm font-semibold">{label}
          <input value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input + " mt-1"} />
        </label>
      ))}
      <button onClick={simpan} className={btn}>Simpan Footer</button>
    </div>
  );
}
