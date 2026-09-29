"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  LayoutDashboard,
  LogOut,
  History,
  Ellipsis,
  PhilippinePeso,
  Settings,
  Sparkles,
  Crown,
  Target,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS, ROUTES } from "@/constants/index";
import { useAuth } from "@/context/Authcontext";
import ThemeToggle from "./ThemeToggle";

const NAV_ICONS: Record<string, LucideIcon> = {
  [ROUTES.DASHBOARD]: LayoutDashboard,
  [ROUTES.ACCOUNTS]: WalletCards,
  [ROUTES.TRANSACTIONS]: History,
  [ROUTES.BUDGET]: Target,
  [ROUTES.LOANS]: HandCoins,
  [ROUTES.AI_ASSISTANT]: Bot,
  [ROUTES.ANALYTICS]: BarChart3,
  [ROUTES.SETTINGS]: Settings,
  [ROUTES.SUBSCRIPTION]: Crown,
};

const SIDEBAR_STATE_KEY = "casha_sidebar_collapsed";
const SIDEBAR_GROUPS_KEY = "casha_sidebar_groups";
const DEFAULT_GROUPS: Record<string, boolean> = {
  money: true,
  planning: false,
  intelligence: false,
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  money: PhilippinePeso,
  planning: CalendarRange,
  intelligence: Sparkles,
};

type MobileSection = "money" | "planning" | "intelligence" | "more";

const MOBILE_GROUPS = [
  { id: "money", label: "Money", icon: PhilippinePeso },
  { id: "planning", label: "Planning", icon: CalendarRange },
  { id: "intelligence", label: "Intelligence", icon: Sparkles },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileSection>("more");
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(DEFAULT_GROUPS);

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
      setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "true");

      let savedGroups = DEFAULT_GROUPS;
      try {
        savedGroups = {
          ...DEFAULT_GROUPS,
          ...JSON.parse(window.localStorage.getItem(SIDEBAR_GROUPS_KEY) || "{}"),
        };
      } catch {
        savedGroups = DEFAULT_GROUPS;
      }

      const activeGroup = NAV_GROUPS.find((group) =>
        group.items.some((item) => pathname?.startsWith(item.href)),
      );
      if (activeGroup) savedGroups[activeGroup.id] = true;
      setOpenGroups(savedGroups);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }

  function toggleGroup(groupId: string) {
    if (collapsed && !isMobile) {
      setCollapsed(false);
      window.localStorage.setItem(SIDEBAR_STATE_KEY, "false");
    }

    setOpenGroups((current) => {
      const next = {
        ...current,
        [groupId]: collapsed && !isMobile ? true : !current[groupId],
      };
      window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleMobileSection(section: MobileSection) {
    if (mobileOpen && mobileSection === section) setMobileOpen(false);
    else {
      setMobileSection(section);
      setMobileOpen(true);
    }
  }

  const activeMobileGroup = NAV_GROUPS.find((group) =>
    group.items.some((item) => pathname?.startsWith(item.href)),
  )?.id;

  return (
    <>
    <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-[#073f30] px-4 text-white lg:hidden">
      <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 font-extrabold text-emerald-200">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#073f30]">₱</span>
        Casha-Ba
      </Link>
      <ThemeToggle />
    </div>
    <nav aria-label="Mobile navigation" className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 grid-cols-5 items-center rounded-[1.75rem] border border-slate-200 bg-white/95 px-2 py-2 text-slate-600 shadow-[0_14px_45px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 lg:hidden ${mobileOpen ? "z-[70]" : "z-40"}`}>
      <Link href={ROUTES.DASHBOARD} aria-current={pathname === ROUTES.DASHBOARD ? "page" : undefined} onClick={() => setMobileOpen(false)} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-semibold ${pathname === ROUTES.DASHBOARD && !mobileOpen ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}><LayoutDashboard className="h-[19px] w-[19px]" aria-hidden="true" /><span>Home</span></Link>
      {MOBILE_GROUPS.map(({ id, label, icon: Icon }) => {
        const active = mobileOpen ? mobileSection === id : activeMobileGroup === id;
        return <button key={id} type="button" onClick={() => toggleMobileSection(id)} aria-label={`Open ${label} navigation`} aria-expanded={mobileOpen && mobileSection === id} aria-controls="user-navigation" className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[9px] font-semibold ${active ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}><Icon className="h-[19px] w-[19px]" aria-hidden="true" /><span>{label}</span></button>;
      })}
      <button type="button" onClick={() => toggleMobileSection("more")} aria-label="More navigation options" aria-expanded={mobileOpen && mobileSection === "more"} aria-controls="user-navigation" className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-semibold ${(mobileOpen && mobileSection === "more") || (!mobileOpen && (pathname?.startsWith(ROUTES.SUBSCRIPTION) || pathname?.startsWith(ROUTES.SETTINGS))) ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}><Ellipsis className="h-[19px] w-[19px]" aria-hidden="true" /><span>More</span></button>
    </nav>
    {mobileOpen && <button type="button" className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />}
    <aside
      id="user-navigation"
      aria-label="Main navigation"
      inert={isMobile && !mobileOpen}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] h-auto max-h-[min(70dvh,calc(100dvh-11rem))] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#073f30] text-white shadow-2xl lg:sticky lg:top-0 lg:bottom-auto lg:left-0 lg:flex lg:h-screen lg:max-h-none lg:max-w-none lg:translate-x-0 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:shadow-none ${mobileOpen ? "flex" : "hidden"} ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={`flex h-20 shrink-0 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
          }`}
        >
          <div className={`min-w-0 items-center gap-3 ${collapsed ? "flex lg:hidden" : "flex"}`}>
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-base font-extrabold text-[#073f30] shadow-[0_10px_28px_rgba(16,185,129,0.2)]"
            >
              ₱
            </span>
            <span className={`text-xl font-extrabold tracking-[-0.04em] text-emerald-300 ${collapsed ? "lg:hidden" : ""}`}><span className="lg:hidden">{mobileSection === "more" ? "More" : NAV_GROUPS.find((group) => group.id === mobileSection)?.label}</span><span className="hidden lg:inline">Casha-Ba?</span></span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-100/80 text-emerald-50 transition hover:border-white hover:bg-white/10 hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 lg:hidden" aria-label="Close navigation menu"><X className="h-5 w-5" /></button>
        </div>

        <nav className="sidebar-nav min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 lg:px-4">
          <div className="flex flex-col gap-1.5">
          <div className="space-y-3 lg:hidden">
            {NAV_GROUPS.filter((group) => group.id === mobileSection).map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200/60">{group.label}</p>
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium ${active ? "bg-white/12 text-white" : "text-emerald-50/75 hover:bg-white/7 hover:text-white"}`}>
                      <Icon className="h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
          <Link
            href={ROUTES.DASHBOARD}
            onClick={() => setMobileOpen(false)}
            title="Dashboard"
            className={`group hidden h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:flex ${
              pathname === ROUTES.DASHBOARD
                ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-emerald-50/70 hover:bg-white/7 hover:text-white"
            }`}
          >
            <LayoutDashboard
              className={`h-5 w-5 shrink-0 transition-colors ${
                pathname === ROUTES.DASHBOARD
                  ? "text-emerald-300"
                  : "text-emerald-100/65 group-hover:text-emerald-200"
              }`}
              strokeWidth={1.9}
            />
            <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
              Dashboard
            </span>
          </Link>

          {NAV_GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group.id];
            const groupActive = group.items.some((item) =>
              pathname?.startsWith(item.href),
            );
            const groupOpen = Boolean(openGroups[group.id]);

            return (
              <div key={group.id} className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  title={group.label}
                  aria-expanded={groupOpen}
                  className={`group flex h-12 w-full items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
                    groupActive
                      ? "bg-white/10 text-white"
                      : "text-emerald-50/70 hover:bg-white/7 hover:text-white"
                  }`}
                >
                  <GroupIcon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      groupActive
                        ? "text-emerald-300"
                        : "text-emerald-100/65 group-hover:text-emerald-200"
                    }`}
                    strokeWidth={1.9}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-left ${
                      collapsed ? "lg:hidden" : ""
                    }`}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    collapsed ? "lg:hidden" : ""
                    } ${groupOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {(!collapsed || isMobile) && groupOpen && (
                  <div className="mt-1 space-y-1 border-l border-white/10 pl-3 lg:ml-5">
                    {group.items.map((item) => {
                      const active = pathname?.startsWith(item.href);
                      const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={item.label}
                          className={`group flex h-10 items-center justify-start gap-3 rounded-lg px-3 text-[13px] font-medium transition-all ${
                            active
                              ? "bg-emerald-300/12 text-white"
                              : "text-emerald-50/60 hover:bg-white/7 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active
                                ? "text-emerald-300"
                                : "text-emerald-100/55 group-hover:text-emerald-200"
                            }`}
                            strokeWidth={1.9}
                          />
                          <span className="truncate">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className={`mt-2 border-t border-white/10 pt-2 ${mobileSection === "more" ? "" : "hidden lg:block"}`}>
            <Link href={ROUTES.SUBSCRIPTION} onClick={() => setMobileOpen(false)} title="Casha-Ba Plus" className={`group flex h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all ${pathname?.startsWith(ROUTES.SUBSCRIPTION) ? "bg-white/12 text-white" : "text-emerald-50/70 hover:bg-white/7 hover:text-white"}`}><Crown className="h-5 w-5 shrink-0 text-emerald-200" strokeWidth={1.9} /><span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>Casha-Ba Plus</span></Link>
            <Link
              href={ROUTES.SETTINGS}
              onClick={() => setMobileOpen(false)}
              title="Settings"
              className={`group flex h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
                pathname?.startsWith(ROUTES.SETTINGS)
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-emerald-50/70 hover:bg-white/7 hover:text-white"
              }`}
            >
              <Settings
                className={`h-5 w-5 shrink-0 transition-colors ${
                  pathname?.startsWith(ROUTES.SETTINGS)
                    ? "text-emerald-300"
                    : "text-emerald-100/65 group-hover:text-emerald-200"
                }`}
                strokeWidth={1.9}
              />
              <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                Settings
              </span>
            </Link>
          </div>
          </div>
        </nav>
      </div>

      <div
        className={`shrink-0 border-t border-white/10 bg-[#073f30] ${
          collapsed ? "p-2" : "p-3 lg:p-4"
        }`}
      >
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
                user?.name ? user.name[0].toUpperCase() : "C"
              )}
            </div>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold leading-tight">
                {user?.name ?? "Casha-Ba User"}
              </p>
              <p className="mt-1 truncate text-xs capitalize text-emerald-100/60">
                {user?.customRole || (user?.role && user.role.length > 0 ? user.role[0] : "Personal")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className={`rounded-lg p-2 text-emerald-100/60 transition hover:bg-white/10 hover:text-white ${collapsed ? "lg:hidden" : ""}`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
