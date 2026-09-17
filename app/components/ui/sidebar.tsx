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
  PhilippinePeso,
  Settings,
  Sparkles,
  Target,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS, ROUTES } from "@/constants/index";
import { useAuth } from "@/context/Authcontext";

const NAV_ICONS: Record<string, LucideIcon> = {
  [ROUTES.DASHBOARD]: LayoutDashboard,
  [ROUTES.ACCOUNTS]: WalletCards,
  [ROUTES.TRANSACTIONS]: History,
  [ROUTES.BUDGET]: Target,
  [ROUTES.LOANS]: HandCoins,
  [ROUTES.AI_ASSISTANT]: Bot,
  [ROUTES.ANALYTICS]: BarChart3,
  [ROUTES.SETTINGS]: Settings,
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

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(DEFAULT_GROUPS);

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
    if (collapsed) {
      setCollapsed(false);
      window.localStorage.setItem(SIDEBAR_STATE_KEY, "false");
    }

    setOpenGroups((current) => {
      const next = {
        ...current,
        [groupId]: collapsed ? true : !current[groupId],
      };
      window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen w-[4.75rem] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#073f30] text-white transition-[width] duration-300 ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={`flex h-20 shrink-0 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
          }`}
        >
          <div className={`min-w-0 items-center gap-3 ${collapsed ? "hidden" : "flex"}`}>
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-base font-extrabold text-[#073f30] shadow-[0_10px_28px_rgba(16,185,129,0.2)]"
            >
              ₱
            </span>
            <span className="hidden text-xl font-extrabold tracking-[-0.04em] text-emerald-300 lg:block">
              Casha-Ba?
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
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="sidebar-nav min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 lg:px-4">
          <div className="flex flex-col gap-1.5">
          <Link
            href={ROUTES.DASHBOARD}
            title="Dashboard"
            className={`group flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:justify-start ${
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
            <span className={`truncate ${collapsed ? "hidden" : "hidden lg:block"}`}>
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
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  title={group.label}
                  aria-expanded={groupOpen}
                  className={`group flex h-12 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:justify-start ${
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
                      collapsed ? "hidden" : "hidden lg:block"
                    }`}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      collapsed ? "hidden" : "hidden lg:block"
                    } ${groupOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {!collapsed && groupOpen && (
                  <div className="mt-1 space-y-1 border-l border-white/10 pl-3 lg:ml-5">
                    {group.items.map((item) => {
                      const active = pathname?.startsWith(item.href);
                      const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.label}
                          className={`group flex h-10 items-center justify-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all lg:justify-start ${
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
                          <span className="hidden truncate lg:block">
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

          <div className="mt-2 border-t border-white/10 pt-2">
            <Link
              href={ROUTES.SETTINGS}
              title="Settings"
              className={`group flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-all lg:justify-start ${
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
              <span className={`truncate ${collapsed ? "hidden" : "hidden lg:block"}`}>
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
            <div className={`min-w-0 ${collapsed ? "hidden" : "hidden lg:block"}`}>
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
            className={`rounded-lg p-2 text-emerald-100/60 transition hover:bg-white/10 hover:text-white ${collapsed ? "hidden" : "hidden lg:block"}`}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
