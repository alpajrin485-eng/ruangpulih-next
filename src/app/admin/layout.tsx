import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const menu: Array<[string, string]> = [
    ["/admin", "Overview"],
    ["/admin/konten", "Konten"],
    ["/admin/hasil", "Hasil"],
    ["/admin/pengguna", "Pengguna"],
    ["/admin/laporan", "Laporan"],
    ["/admin/akun", "Akun"],
  ];
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-gradient-to-b from-violet-950 via-violet-900 to-indigo-900 p-5 text-white md:flex">
        <span className="flex items-center gap-2 px-2 pb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-violet-800">
            Ψ
          </span>
          <span className="text-lg font-bold">Admin</span>
        </span>
        <nav className="flex flex-col gap-1">
          {menu.map(([href, label]) => (
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
