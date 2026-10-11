import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-blue-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-violet-700 shadow ring-2 ring-violet-200">
            Ψ
          </span>
          <span className="text-xl font-bold text-violet-950">RuangPulih</span>
        </span>
        <span className="flex gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 font-semibold text-violet-700 ring-2 ring-violet-200 hover:bg-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-semibold text-white shadow hover:opacity-95"
          >
            Daftar
          </Link>
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-8 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-8 py-16 text-white shadow-xl ring-2 ring-white/60">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl font-bold text-violet-700 shadow ring-4 ring-violet-200">
            Ψ
          </div>
          <h1 className="text-4xl font-extrabold md:text-5xl">Belajar Sehat, Tumbuh Hebat</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-100">
            Ruang edukasi psikologi untuk membantu pelajar memahami diri,
            mengelola tekanan belajar, dan menjaga keseimbangan jiwa.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3 font-bold text-violet-700 shadow hover:bg-violet-50"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/tentang"
              className="rounded-xl px-6 py-3 font-bold text-white ring-2 ring-white/70 hover:bg-white/10"
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3">
        {[
          ["Kenali Diri", "Luangkan waktu untuk memahami kondisi belajar dan perasaan Anda."],
          ["Teman Belajar", "Perangkat sederhana untuk mengatur waktu belajar dan istirahat."],
          ["Edukasi Psikologi", "Pelajari stres belajar, burnout, tidur, dan kebiasaan belajar."],
        ].map(([t, d]) => (
          <div
            key={t}
            className="rounded-2xl border-2 border-violet-100 border-t-4 border-t-violet-600 bg-white p-7 shadow-sm"
          >
            <h3 className="text-lg font-bold text-violet-900">{t}</h3>
            <p className="mt-2 text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto mb-8 max-w-6xl rounded-2xl border-2 border-violet-100 bg-white px-6 py-6 text-center text-slate-500">
        <span className="font-bold text-violet-800">RuangPulih</span>
        <br />
        Teman belajar untuk tumbuh dengan lebih sehat.
      </footer>
    </main>
  );
}
