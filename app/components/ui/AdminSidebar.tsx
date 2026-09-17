"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  PhilippinePeso,
  Settings,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/Authcontext";

const ADMIN_SIDEBAR_STATE_KEY = "casha_admin_sidebar_collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollapsed(window.localStorage.getItem(ADMIN_SIDEBAR_STATE_KEY) === "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(ADMIN_SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }

  const manageUsersActive = pathname?.startsWith("/admin/manage-users");
  const settingsActive = pathname?.startsWith("/admin/appearance");

  return (
    <aside
      className={`sticky top-0 flex h-screen w-[4.75rem] shrink-0 flex-col justify-between border-r border-white/10 bg-[#073f30] text-white transition-[width] duration-300 ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className="min-h-0">
        <div
          className={`flex h-20 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
          }`}
        >
          <div className={`min-w-0 items-center gap-3 ${collapsed ? "hidden" : "flex"}`}>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-[#073f30] shadow-[0_10px_28px_rgba(16,185,129,0.2)]">
              <PhilippinePeso className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="hidden text-xl font-extrabold tracking-[-0.04em] text-emerald-300 lg:block">
              Casha-Ba
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-100/80 text-emerald-50 transition hover:border-white hover:bg-white/10 hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 py-5 lg:px-4">
          <Link
            href="/admin/manage-users"
            title="Manage Users"
            aria-current={manageUsersActive ? "page" : undefined}
            className={`group flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:justify-start ${
              manageUsersActive
                ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-emerald-50/70 hover:bg-white/7 hover:text-white"
            }`}
          >
            <Users
              className={`h-5 w-5 shrink-0 transition-colors ${
                manageUsersActive
                  ? "text-emerald-300"
                  : "text-emerald-100/65 group-hover:text-emerald-200"
              }`}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span className={`truncate ${collapsed ? "hidden" : "hidden lg:block"}`}>
              Manage Users
            </span>
          </Link>

          <div className="mt-2 border-t border-white/10 pt-2">
            <Link
              href="/admin/appearance"
              title="Settings"
              aria-current={settingsActive ? "page" : undefined}
              className={`group flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:justify-start ${
                settingsActive
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-emerald-50/70 hover:bg-white/7 hover:text-white"
              }`}
            >
              <Settings
                className={`h-5 w-5 shrink-0 transition-colors ${
                  settingsActive
                    ? "text-emerald-300"
                    : "text-emerald-100/65 group-hover:text-emerald-200"
                }`}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              <span className={`truncate ${collapsed ? "hidden" : "hidden lg:block"}`}>
                Settings
              </span>
            </Link>
          </div>
        </nav>
      </div>

      <div className={`border-t border-white/10 ${collapsed ? "p-2" : "p-3 lg:p-4"}`}>
        <div
          className={`flex items-center justify-center ${
            collapsed
              ? "rounded-xl p-1.5"
              : "rounded-2xl bg-white/7 p-2.5 lg:justify-between lg:p-3"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-emerald-100">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className={`min-w-0 ${collapsed ? "hidden" : "hidden lg:block"}`}>
              <p className="truncate text-sm font-semibold leading-tight">
                {user?.name ?? "Admin User"}
              </p>
              <p className="mt-1 truncate text-xs text-emerald-100/60">System Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className={`rounded-lg p-2 text-emerald-100/60 transition hover:bg-white/10 hover:text-white ${
              collapsed ? "hidden" : "hidden lg:block"
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
