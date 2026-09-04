import Link from "next/link";
import { logoutAdmin } from "@/actions/admin";
import { CafeShell } from "@/components/layout/CafeShell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CafeShell wide>
      <header className="sticky top-0 z-50 mt-4 mb-6 rounded-3xl bg-white/90 backdrop-blur-xl border-b-4 border-red-500 px-4 py-4 shadow-lg dark:bg-zinc-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/adda.png" alt="Adda" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="font-black text-gray-800 dark:text-white">Adda Admin</p>
              <p className="text-xs text-gray-500">Menu, customers, QR, settings</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link className="rounded-2xl bg-red-50 px-3 py-2 text-red-700" href="/admin">
              Dashboard
            </Link>
            <Link className="rounded-2xl bg-red-50 px-3 py-2 text-red-700" href="/admin/menu">
              Menu
            </Link>
            <Link className="rounded-2xl bg-red-50 px-3 py-2 text-red-700" href="/admin/customers">
              Customers
            </Link>
            <Link className="rounded-2xl bg-red-50 px-3 py-2 text-red-700" href="/admin/qr">
              Table QR
            </Link>
            <Link className="rounded-2xl bg-red-50 px-3 py-2 text-red-700" href="/admin/settings">
              Settings
            </Link>
            <form action={logoutAdmin}>
              <button className="rounded-2xl px-3 py-2 text-gray-500" type="submit">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </CafeShell>
  );
}
