"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MateriAdmin = { id: string; judul: string; deskripsi: string | null; link: string | null };
type BlokB = {
  followupId: string;
  materi: string | null;
  plan: string | null;
  fokus: number;
  istirahat: number;
  selesai: boolean;
  konselor: string;
};

function nadaBawaan() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = i === 2 ? 880 : 660;
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* abaikan */
  }
}

export default function TemanBelajar() {
  const [fokus, setFokus] = useState(25);
  const [istirahat, setIstirahat] = useState(5);
  const [preset, setPreset] = useState<{ fokus: number; istirahat: number } | null>(null);
  const [diubahManual, setDiubahManual] = useState(false);
  const [alarmUrl, setAlarmUrl] = useState("");
  const [materiAdmin, setMateriAdmin] = useState<MateriAdmin[]>([]);
  const [blokB, setBlokB] = useState<BlokB | null>(null);
  const [fase, setFase] = useState<"idle" | "fokus" | "istirahat" | "selesai">("idle");
  const [sisa, setSisa] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const akhir = useRef(0);
  const faseRef = useRef<"fokus" | "istirahat">("fokus");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();
      const { data: st } = await supabase.from("study_materials").select("id,judul,deskripsi,link").eq("aktif", true).order("urutan");
      setMateriAdmin((st as MateriAdmin[]) ?? []);
      const { data: cfg } = await supabase.from("settings").select("key,value").in("key", ["default_focus", "default_rest", "alarm_url"]);
      const map: Record<string, string> = {};
      (cfg ?? []).forEach((c: { key: string; value: string | null }) => {
        map[c.key] = c.value ?? "";
      });
      if (map["alarm_url"]) setAlarmUrl(map["alarm_url"]);
      let f = parseInt(map["default_focus"] || "25", 10) || 25;
      let r = parseInt(map["default_rest"] || "5", 10) || 5;
      let dariKonselor = false;
      if (user.user) {
        const { data: us } = await supabase.from("user_settings").select("focus_minutes,rest_minutes,updated_at").eq("user_id", user.user.id).single();
        if (us) {
          f = us.focus_minutes;
          r = us.rest_minutes;
          setDiubahManual(true);
        }
        const { data: fu } = await supabase
          .from("followups")
          .select("id,materi_custom,plan,focus_minutes,rest_minutes,selesai_oleh_user,created_at,sessions!inner(user_id,status,counselors(profiles(nama))))")
          .eq("sessions.user_id", user.user.id)
          .eq("sessions.status", "selesai")
          .eq("sudah_diisi", true)
          .order("created_at", { ascending: false })
          .limit(1);
        const row = (fu as unknown as Array<{
          id: string; materi_custom: string | null; plan: string | null;
          focus_minutes: number | null; rest_minutes: number | null;
          selesai_oleh_user: boolean; created_at: string;
          sessions: { counselors: { profiles: { nama: string | null } } | null };
        }>)?.[0];
        if (row) {
          setBlokB({
            followupId: row.id,
            materi: row.materi_custom,
            plan: row.plan,
            fokus: row.focus_minutes ?? f,
            istirahat: row.rest_minutes ?? r,
            selesai: row.selesai_oleh_user,
            konselor: row.sessions.counselors?.profiles?.nama ?? "Konselor",
          });
          // Aturan terbaru-menang: preset konselor dipakai bila lebih baru
          // dari perubahan manual terakhir (atau belum pernah diatur manual).
          const manualTs = (us as { updated_at?: string } | null)?.updated_at ?? "";
          if (!us || row.created_at > manualTs) {
            f = row.focus_minutes ?? f;
            r = row.rest_minutes ?? r;
            dariKonselor = true;
          }
        }
      }
      setFokus(f);
      setIstirahat(r);
      if (dariKonselor) setPreset({ fokus: f, istirahat: r });
    })();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function simpanManual(nf: number, nr: number) {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from("user_settings").upsert(
      { user_id: user.user.id, focus_minutes: nf, rest_minutes: nr, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  function ubahFokus(v: number) {
    setFokus(v);
    setDiubahManual(true);
    setPreset(null);
    simpanManual(v, istirahat);
  }
  function ubahIstirahat(v: number) {
    setIstirahat(v);
    setDiubahManual(true);
    setPreset(null);
    simpanManual(fokus, v);
  }
  function kembaliPreset() {
    if (!blokB) return;
    setFokus(blokB.fokus);
    setIstirahat(blokB.istirahat);
    setPreset({ fokus: blokB.fokus, istirahat: blokB.istirahat });
    setDiubahManual(false);
    simpanManual(blokB.fokus, blokB.istirahat);
  }

  function bunyi() {
    if (alarmUrl) {
      new Audio(alarmUrl).play().catch(() => nadaBawaan());
    } else {
      nadaBawaan();
    }
  }

  function mulai() {
    if (timer.current) clearInterval(timer.current);
    faseRef.current = "fokus";
    akhir.current = Date.now() + fokus * 60_000;
    setFase("fokus");
    setSisa(fokus * 60);
    timer.current = setInterval(() => {
      const tinggal = Math.max(0, Math.round((akhir.current - Date.now()) / 1000));
      setSisa(tinggal);
      if (tinggal > 0) return;
      bunyi();
      if (faseRef.current === "fokus") {
        faseRef.current = "istirahat";
        akhir.current = Date.now() + istirahat * 60_000;
        setFase("istirahat");
        setSisa(istirahat * 60);
      } else {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setFase("selesai");
      }
    }, 500);
  }

  function berhenti() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setFase("idle");
    setSisa(0);
  }

  async function tandaiSelesai() {
    if (!blokB) return;
    const supabase = createClient();
    await supabase.from("followups").update({ selesai_oleh_user: true }).eq("id", blokB.followupId);
    setBlokB({ ...blokB, selesai: true });
  }

  const mm = String(Math.floor(sisa / 60)).padStart(2, "0");
  const dd = String(sisa % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-violet-950">Teman Belajar</h1>

      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 p-8 text-center text-white shadow">
        <p className="text-sm text-violet-200">
          {fase === "idle" ? "Siap fokus?" : fase === "fokus" ? "Sesi Fokus" : fase === "istirahat" ? "Istirahat" : "Selesai"}
        </p>
        <p className="my-2 font-mono text-6xl font-extrabold tabular-nums">
          {fase === "idle" ? `${String(fokus).padStart(2, "0")}:00` : `${mm}:${dd}`}
        </p>
        {preset && (
          <p className="mx-auto mb-3 w-fit rounded-full bg-white/20 px-4 py-1 text-xs font-bold">
            Ditentukan oleh konselor Anda ({preset.fokus}/{preset.istirahat} mnt)
          </p>
        )}
        {diubahManual && !preset && (
          <p className="mx-auto mb-3 w-fit rounded-full bg-white/20 px-4 py-1 text-xs">
            Diatur manual
          </p>
        )}
        {blokB && (fokus !== blokB.fokus || istirahat !== blokB.istirahat) && (
          <p className="mx-auto mb-3 w-fit rounded-full bg-white/20 px-4 py-1 text-xs">
            Anjuran konselor: {blokB.fokus}/{blokB.istirahat} mnt
            <button onClick={kembaliPreset} className="ml-2 font-bold underline">
              Kembalikan ke anjuran konselor
            </button>
          </p>
        )}
        <div className="mx-auto mt-2 grid max-w-md grid-cols-2 gap-3">
          <label className="text-left text-sm">Fokus (menit)
            <input type="number" min={1} max={120} value={fokus} disabled={fase !== "idle"}
              onChange={(e) => ubahFokus(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1 w-full rounded-xl px-3 py-2 text-slate-800" />
          </label>
          <label className="text-left text-sm">Istirahat (menit)
            <input type="number" min={1} max={60} value={istirahat} disabled={fase !== "idle"}
              onChange={(e) => ubahIstirahat(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1 w-full rounded-xl px-3 py-2 text-slate-800" />
          </label>
        </div>
        <div className="mt-4 flex justify-center gap-3">
          {fase === "idle" || fase === "selesai" ? (
            <button onClick={mulai} className="rounded-xl bg-white px-8 py-3 font-bold text-violet-700 shadow">
              Mulai Belajar
            </button>
          ) : (
            <button onClick={berhenti} className="rounded-xl bg-white px-8 py-3 font-bold text-violet-700 shadow">
              Berhenti
            </button>
          )}
        </div>
        {fase === "selesai" && <p className="mt-3 font-semibold">Waktu habis. Saatnya istirahat yang cukup.</p>}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-violet-950">Materi dari Admin</h2>
        {materiAdmin.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada materi. Silakan hubungi admin.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {materiAdmin.map((m) => (
              <li key={m.id} className="rounded-xl border px-4 py-3">
                <p className="font-bold">{m.judul}</p>
                {m.deskripsi && <p className="text-sm text-slate-600">{m.deskripsi}</p>}
                {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-violet-700">Buka tautan →</a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {blokB && (
        <section className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-6 shadow-sm">
          <h2 className="font-bold text-violet-950">Materi & Plan dari {blokB.konselor}</h2>
          {blokB.materi && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-500">Materi yang harus dipelajari</p>
              <p className="text-slate-700">{blokB.materi}</p>
            </div>
          )}
          {blokB.plan && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-500">Plan tindak lanjut</p>
              <p className="text-slate-700">{blokB.plan}</p>
            </div>
          )}
          {!blokB.selesai ? (
            <button onClick={tandaiSelesai} className="mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white">
              Tandai Sudah Dilakukan
            </button>
          ) : (
            <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700 ring-1 ring-green-200">
              Sudah ditandai dilakukan. Konselor Anda dapat melihatnya.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
