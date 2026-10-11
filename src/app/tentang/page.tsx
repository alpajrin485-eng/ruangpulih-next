export default function Tentang() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 px-8 py-12 text-center text-white shadow">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl font-bold text-violet-700">
          Ψ
        </div>
        <h1 className="text-3xl font-extrabold">Tentang RuangPulih</h1>
        <p className="mt-2 text-violet-100">Platform edukasi psikologi untuk pelajar.</p>
      </div>
      <div className="mt-6 space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-violet-900">Tujuan RuangPulih</h2>
          <p className="mt-2 text-slate-600">
            RuangPulih dibuat sebagai ruang belajar yang lebih seimbang. Selain belajar,
            siswa juga diajak memperhatikan kondisi diri dan waktu istirahat.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-violet-900">Fitur RuangPulih</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            <li><b>Kenali Kondisimu</b> — refleksi sederhana mengenai kondisi belajar.</li>
            <li><b>Teman Belajar</b> — membantu mengatur sesi belajar dan istirahat.</li>
            <li><b>Edukasi Psikologi</b> — materi seputar belajar dan kesehatan mental.</li>
            <li><b>Konsultasi</b> — chat dengan konselor dan terima rencana tindak lanjut.</li>
          </ul>
        </section>
        <section className="rounded-xl border-l-4 border-violet-600 bg-violet-50 p-4 text-slate-600">
          Belajar bukan hanya tentang mendapatkan nilai. Menjaga keseimbangan antara
          belajar, istirahat, dan kehidupan sehari-hari juga penting.
        </section>
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">RuangPulih — Belajar sehat, tumbuh hebat.</p>
    </main>
  );
}
