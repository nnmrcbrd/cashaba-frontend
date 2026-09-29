"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Ellipsis,
  PhilippinePeso,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/Authcontext";
import ThemeToggle from "./ThemeToggle";

const ADMIN_SIDEBAR_STATE_KEY = "casha_admin_sidebar_collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setIsMobile(query.matches);
      if (!query.matches) setMobileOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

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

  return (
    <>
    <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-[#073f30] px-4 text-white lg:hidden">
      <Link href="/admin/manage-users" className="flex items-center gap-2 font-extrabold text-emerald-200"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#073f30]"><PhilippinePeso className="h-5 w-5" /></span>Casha-Ba Admin</Link>
      <ThemeToggle />
    </div>
    <nav aria-label="Mobile admin navigation" className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 grid w-[calc(100%-1.5rem)] max-w-xs -translate-x-1/2 grid-cols-2 items-center rounded-[1.75rem] border border-slate-200 bg-white/95 px-2 py-2 text-slate-600 shadow-[0_14px_45px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 lg:hidden ${mobileOpen ? "z-[70]" : "z-40"}`}>
      <Link href="/admin/manage-users" aria-current={manageUsersActive ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold ${manageUsersActive ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}><Users className="h-[19px] w-[19px]" aria-hidden="true" /><span>Users</span></Link>
      <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="More admin navigation options" aria-expanded={mobileOpen} aria-controls="admin-navigation" className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold ${mobileOpen ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}><Ellipsis className="h-[19px] w-[19px]" aria-hidden="true" /><span>More</span></button>
    </nav>
    {mobileOpen && <button type="button" className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden" aria-label="Close admin navigation menu" onClick={() => setMobileOpen(false)} />}
    <aside
      id="admin-navigation"
      aria-label="Admin navigation"
      inert={isMobile && !mobileOpen}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] h-auto max-h-[min(70dvh,calc(100dvh-11rem))] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#073f30] text-white shadow-2xl lg:sticky lg:top-0 lg:bottom-auto lg:left-0 lg:flex lg:h-screen lg:max-h-none lg:max-w-none lg:translate-x-0 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:shadow-none ${mobileOpen ? "flex" : "hidden"} ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className="min-h-0">
        <div
          className={`flex h-20 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
          }`}
        >
          <div className={`min-w-0 items-center gap-3 ${collapsed ? "flex lg:hidden" : "flex"}`}>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-[#073f30] shadow-[0_10px_28px_rgba(16,185,129,0.2)]">
              <PhilippinePeso className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className={`text-xl font-extrabold tracking-[-0.04em] text-emerald-300 ${collapsed ? "lg:hidden" : ""}`}><span className="lg:hidden">More</span><span className="hidden lg:inline">Casha-Ba</span></span>
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
          <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 lg:hidden" aria-label="Close admin navigation menu"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 py-5 lg:px-4">
          <Link
            href="/admin/manage-users"
            onClick={() => setMobileOpen(false)}
            title="Manage Users"
            aria-current={manageUsersActive ? "page" : undefined}
            className={`group flex h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
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
            <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
              Manage Users
            </span>
          </Link>

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
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-emerald-100">
              {user?.avatar ? (
                <Image src={user.avatar} alt="" fill sizes="36px" unoptimized className="object-cover" />
              ) : (
                user?.name ? user.name[0].toUpperCase() : "A"
              )}
            </div>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
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
              collapsed ? "lg:hidden" : ""
            }`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
