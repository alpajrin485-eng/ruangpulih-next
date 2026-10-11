import Link from "next/link";
import LogoutButton from "@/components/logout-button";

const MENU = [
  ["/app", "Dashboard"],
  ["/app/kuis", "Kuis"],
  ["/app/refleksi", "Refleksi"],
  ["/app/teman-belajar", "Teman Belajar"],
  ["/app/konsultasi", "Konsultasi"],
  ["/app/profil", "Profil"],
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-violet-50/60">
      <aside className="hidden w-60 shrink-0 flex-col bg-gradient-to-b from-violet-800 via-indigo-700 to-blue-700 p-5 text-white md:flex">
        <span className="flex items-center gap-2 px-2 pb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-violet-700">
            Ψ
          </span>
          <span className="text-lg font-bold">RuangPulih</span>
        </span>
        <nav className="flex flex-col gap-1">
          {MENU.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-4 py-2.5 font-semibold text-violet-100 hover:bg-white/15"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white/80 px-6 py-3 backdrop-blur md:hidden">
          <span className="font-bold text-violet-900">RuangPulih</span>
          <LogoutButton />
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 md:hidden">
          {MENU.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
