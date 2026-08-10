"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/Authcontext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-[#0b422d] text-white shrink-0 sticky top-0 font-sans">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-6 text-xl font-bold tracking-tight flex items-center gap-2.5 border-b border-emerald-900/50">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-lg font-bold text-base shadow-sm">₱</span>
          <span>Casha<span className="text-emerald-400">-Ba</span></span>
        </div>

        {/* Navigation Item matching Figma */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          <Link
            href="/admin/manage-users"
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-bold uppercase tracking-wider bg-[#165a3f] text-white shadow-sm"
          >
            <span className="text-base">👥</span>
            <span>MANAGE USERS</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Profile Pill matching Figma Admin Pill */}
      <div className="p-4 border-t border-emerald-900/50">
        <div className="flex items-center justify-between bg-[#4eb589] p-3 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 border border-white/30">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold truncate leading-tight">{user?.name ?? "Admin User"}</p>
              <p className="text-[10px] text-emerald-100 font-medium leading-tight">System Admin</p>
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
