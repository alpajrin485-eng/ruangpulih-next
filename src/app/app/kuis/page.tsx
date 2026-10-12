"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Soal = { question: string; options: string[]; answer: number; explanation: string };
type Video = { judul: string; tipe: string; kind: string; src: string };

function youtubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function KartuVideo({ v, label }: { v?: Video; label: string }) {
  if (!v)
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
        Video {label.toLowerCase()} belum diunggah admin.
      </p>
    );
  return (
    <div>
      <p className="mb-2 font-semibold">{v.judul}</p>
      {v.kind === "youtube" ? (
        (() => {
          const id = youtubeId(v.src);
          return id ? (
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              title={v.judul}
              allowFullScreen
              className="aspect-video w-full rounded-xl ring-1 ring-slate-200"
            />
          ) : (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Tautan YouTube tidak dikenali. Gunakan tombol di bawah untuk menonton.
            </p>
          );
        })()
      ) : (
        <video src={v.src} controls className="w-full rounded-xl ring-1 ring-slate-200" />
      )}
      {v.kind === "youtube" && (
        <a
          href={v.src}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block rounded-xl px-4 py-2 text-sm font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50"
        >
          Tonton di YouTube
        </a>
      )}
    </div>
  );
}

export default function Kuis() {
  const [soal, setSoal] = useState<Soal[] | null>(null);
  const [mulai, setMulai] = useState(false);
  const [index, setIndex] = useState(0);
  const [benar, setBenar] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [terkunci, setTerkunci] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [menonton, setMenonton] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("questions")
      .select("question,options,answer,explanation")
      .eq("aktif", true)
      .order("urutan")
      .then(({ data }) => setSoal((data as Soal[]) ?? []));
    supabase
      .from("videos")
      .select("judul,tipe,kind,src")
      .eq("aktif", true)
      .then(({ data }) => setVideos((data as Video[]) ?? []));
  }, []);

  async function simpanSkor(score: number) {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const menit = new Date().toISOString().slice(0, 16);
    const { data: terakhir } = await supabase
      .from("quiz_results")
      .select("skor,tanggal")
      .eq("user_id", user.user.id)
      .order("tanggal", { ascending: false })
      .limit(1)
      .single();
    if (terakhir && terakhir.skor === score && String(terakhir.tanggal).slice(0, 16) === menit) return;
    await supabase.from("quiz_results").insert({ user_id: user.user.id, skor: score });
  }

  async function tandaiMenonton() {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data: terakhir } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", user.user.id)
      .order("tanggal", { ascending: false })
      .limit(1)
      .single();
    if (terakhir) {
      await supabase.from("quiz_results").update({ menonton: true }).eq("id", terakhir.id);
      setMenonton(true);
    }
  }

  if (soal === null) return <p className="p-6 text-slate-500">Memuat soal...</p>;
  if (soal.length === 0)
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-500 shadow-sm">
        Belum ada soal kuis. Silakan hubungi admin.
      </div>
    );

  const edukasi = videos.find((v) => v.tipe === "edukasi");
  const motivasi = videos.find((v) => v.tipe === "motivasi");

  if (!mulai) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-violet-950">Kuis RuangPulih</h1>
        <p className="text-slate-600">
          Seberapa siap Anda menghadapi tantangan belajar? Anda akan menghadapi beberapa{" "}
          <b>situasi dalam kehidupan belajar sehari-hari</b>. Pilih jawaban yang paling tepat.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[["Pertanyaan", String(soal.length)], ["Poin", "100"], ["Mode", "Santai"]].map(([t, v]) => (
            <div key={t} className="rounded-2xl border bg-white p-4 text-center shadow-sm">
              <p className="text-xs text-slate-400">{t}</p>
              <p className="text-xl font-extrabold text-violet-900">{v}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setMulai(true);
            setIndex(0);
            setBenar(0);
            setPilih(null);
            setTerkunci(false);
            setSelesai(false);
            setMenonton(false);
          }}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow"
        >
          Mulai Kuis
        </button>
      </div>
    );
  }

  if (selesai) {
    const score = Math.round((benar / soal.length) * 100);
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-violet-950">Kuis Selesai!</h1>
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-400">Skor Anda</p>
          <p className="text-4xl font-extrabold text-violet-900">{score} / 100</p>
        </div>
        {score <= 50 ? (
          <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-violet-950">Video Pemulihan untuk Anda</h2>
            <p className="text-sm text-slate-600">
              Skor Anda <b>{score}/100</b>. Luangkan waktu sejenak dan tonton kedua video berikut.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <KartuVideo v={edukasi} label="Edukasi" />
              <KartuVideo v={motivasi} label="Motivasi" />
            </div>
            {!menonton ? (
              <button
                onClick={tandaiMenonton}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow"
              >
                Saya Sudah Menonton
              </button>
            ) : (
              <p className="rounded-xl bg-green-50 p-3 text-center text-sm text-green-700 ring-1 ring-green-200">
                Terima kasih. Status menonton sudah dicatat.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-violet-950">Video Motivasi untuk Anda</h2>
            <p className="text-sm text-slate-600">
              Skor Anda <b>{score}/100</b>. Pertahankan, dan luangkan waktu sejenak untuk
              menonton video berikut.
            </p>
            <KartuVideo v={motivasi} label="Motivasi" />
          </div>
        )}
        <button
          onClick={() => {
            setMulai(false);
          }}
          className="w-full rounded-xl py-3 font-bold text-violet-700 ring-2 ring-violet-200 hover:bg-violet-50"
        >
          Main Lagi
        </button>
      </div>
    );
  }

  const cur = soal[index];
  const poin = Math.round(100 / soal.length);
  return (
    <div className="space-y-4">
      <div className="h-2 overflow-hidden rounded-full bg-violet-100">
        <div className="h-full bg-gradient-to-r from-violet-600 to-blue-600" style={{ width: `${(index / soal.length) * 100}%` }} />
      </div>
      <p className="text-sm text-slate-400">Pertanyaan {index + 1} dari {soal.length}</p>
      <h2 className="text-xl font-extrabold text-violet-950">Tantangan {index + 1}</h2>
      <p className="text-lg font-semibold">{cur.question}</p>
      <div className="space-y-2">
        {cur.options.map((op, i) => (
          <label
            key={i}
            className={`block cursor-pointer rounded-xl border bg-white p-4 shadow-sm ring-2 transition ${
              pilih === i ? "ring-violet-500" : "ring-transparent"
            } ${terkunci ? "pointer-events-none opacity-80" : "hover:ring-violet-200"}`}
          >
            <input
              type="radio"
              name={`q${index}`}
              checked={pilih === i}
              onChange={() => setPilih(i)}
              className="mr-3 accent-violet-600"
            />
            {op}
          </label>
        ))}
      </div>
      {!terkunci ? (
        <button
          onClick={() => {
            if (pilih === null) return;
            if (pilih === cur.answer) setBenar((b) => b + 1);
            setTerkunci(true);
          }}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow"
        >
          Kunci Jawaban
        </button>
      ) : (
        <div className="space-y-3">
          {pilih === cur.answer ? (
            <p className="rounded-xl bg-green-50 p-3 text-green-700 ring-1 ring-green-200">
              Jawaban Anda benar. +{poin} poin
            </p>
          ) : (
            <div className="rounded-xl bg-red-50 p-3 text-red-700 ring-1 ring-red-200">
              Jawaban Anda belum tepat. Yang tepat: <b>{cur.options[cur.answer]}</b>
            </div>
          )}
          <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 ring-1 ring-blue-100">
            <b>Penjelasan:</b> {cur.explanation}
          </p>
          <button
            onClick={() => {
              if (index + 1 < soal.length) {
                setIndex(index + 1);
                setPilih(null);
                setTerkunci(false);
              } else {
                simpanSkor(Math.round((benar / soal.length) * 100)).finally(() => setSelesai(true));
              }
            }}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-bold text-white shadow"
          >
            {index + 1 < soal.length ? "Tantangan Berikutnya" : "Lihat Hasil Akhir"}
          </button>
        </div>
      )}
    </div>
  );
}
