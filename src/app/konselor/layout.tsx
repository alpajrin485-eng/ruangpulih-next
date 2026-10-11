import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default function KonselorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-blue-50/60">
      <aside className="hidden w-60 shrink-0 flex-col bg-gradient-to-b from-blue-800 via-indigo-700 to-violet-700 p-5 text-white md:flex">
        <span className="flex items-center gap-2 px-2 pb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-700">
            Ψ
          </span>
          <span className="text-lg font-bold">Konselor</span>
        </span>
        <nav className="flex flex-col gap-1">
          {[
            ["/konselor", "Sesi Masuk"],
            ["/konselor/profil", "Profil"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-4 py-2.5 font-semibold text-blue-100 hover:bg-white/15"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <LogoutButton />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
