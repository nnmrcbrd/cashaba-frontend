"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/index";
import { useAuth } from "@/context/Authcontext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-[#0e4d35] text-white shrink-0 sticky top-0">
      <div>
        <div className="px-6 py-6 text-xl font-bold tracking-tight flex items-center gap-2.5 border-b border-emerald-800/40">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-lg font-bold text-base shadow-sm">₱</span>
          <span>Casha<span className="text-emerald-400">-Ba</span></span>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? "bg-[#186849] text-white shadow-sm"
                    : "text-emerald-100/70 hover:bg-[#145b40] hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-emerald-800/40">
        <div className="flex items-center justify-between bg-[#52ba90] p-3 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 border border-white/30">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold truncate leading-tight">{user?.name ?? "Anna Cruz"}</p>
              <p className="text-[10px] text-emerald-100 font-medium leading-tight">
                {user?.role && user.role.length > 0 ? user.role[0] : "Working"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-white/80 hover:text-white p-1 text-xs"
            title="Log out"
          >
            ➔
          </button>
        </div>
      </div>
    </aside>
  );
}