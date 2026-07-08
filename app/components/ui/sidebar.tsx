"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/index";
import { useAuth } from "@/context/Authcontext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-brand-900 text-white">
      <div>
        <div className="px-6 py-6 text-xl font-bold tracking-tight">
          Casha<span className="text-brand-300">-Ba</span>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-brand-600 font-semibold text-white"
                    : "text-brand-100 hover:bg-brand-800"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-brand-800 px-6 py-4">
        <p className="truncate text-sm font-medium">{user?.name ?? "Guest"}</p>
        <p className="truncate text-xs text-brand-300">{user?.email ?? ""}</p>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-lg bg-brand-800 px-3 py-2 text-xs font-semibold hover:bg-brand-700"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}