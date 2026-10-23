"use client";
import TrialNotice from "./TrialNotice";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { normalizeAppPathname } from '@/lib/routeAccess';
import { useEffect, useRef, useState } from "react";
import {
  BarChart3, Bot, CalendarRange, ChevronDown, ChevronLeft, ChevronRight,
  Crown, HandCoins, History, LayoutDashboard, LogOut, Menu,
  PhilippinePeso, Settings, ShieldCheck, Sparkles, Target, Users, WalletCards, X,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS, ROUTES } from "@/constants/index";
import { useAuth } from "@/context/Authcontext";
import ThemeMenuRow from "./ThemeMenuRow";

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
  [ROUTES.ADMIN_MANAGE_USERS]: Users,
  [ROUTES.ADMIN_ACTIVITY_LOGS]: History,
};
const GROUP_ICONS: Record<string, LucideIcon> = {
  money: PhilippinePeso, planning: CalendarRange, intelligence: Sparkles,
  administration: ShieldCheck,
};
const ADMIN_NAV_GROUPS = [{
  id: "administration",
  label: "Administration",
  items: [
    { href: ROUTES.ADMIN_MANAGE_USERS, label: "Manage Users" },
    { href: ROUTES.ADMIN_ACTIVITY_LOGS, label: "Activity Logs" },
  ],
}] as const;
const SIDEBAR_STATE_KEY = "casha_sidebar_collapsed";
const SIDEBAR_GROUPS_KEY = "casha_sidebar_groups";
const DEFAULT_GROUPS: Record<string, boolean> = {
  money: true, planning: false, intelligence: false,
};

export default function Sidebar({ variant = "user" }: { variant?: "user" | "admin" }) {
  const isAdmin = variant === "admin";
  const homeRoute = isAdmin ? ROUTES.ADMIN_MANAGE_USERS : ROUTES.DASHBOARD;
  const navigationId = isAdmin ? "admin-navigation" : "user-navigation";
  const sidebarStateKey = isAdmin ? "casha_admin_sidebar_collapsed" : SIDEBAR_STATE_KEY;
  const sidebarGroupsKey = isAdmin ? "casha_admin_sidebar_groups" : SIDEBAR_GROUPS_KEY;
  const navigationGroups = isAdmin ? ADMIN_NAV_GROUPS : NAV_GROUPS;
  const pathname = normalizeAppPathname(usePathname());
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(isAdmin ? { administration: true } : DEFAULT_GROUPS);
  const drawerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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
    const frame = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setCollapsed(window.localStorage.getItem(sidebarStateKey) === "true");
      let savedGroups: Record<string, boolean> = isAdmin ? { administration: true } : { ...DEFAULT_GROUPS };
      try {
        savedGroups = { ...savedGroups, ...JSON.parse(window.localStorage.getItem(sidebarGroupsKey) || "{}") };
      } catch {
        // Keep the default navigation if an old saved preference is invalid.
      }
      const activeGroup = navigationGroups.find(group => group.items.some(item => pathname?.startsWith(item.href)));
      if (activeGroup) savedGroups[activeGroup.id] = true;
      setOpenGroups(savedGroups);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, sidebarStateKey, sidebarGroupsKey, navigationGroups, isAdmin]);

  useEffect(() => {
    if (!mobileOpen || !isMobile) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const main = drawer.parentElement?.querySelector<HTMLElement>(".app-main");
    const header = headerRef.current;
    const menuButton = menuRef.current;
    const previousMainInert = main?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (main) main.inert = true;
    if (header) header.inert = true;
    document.body.style.overflow = "hidden";
    // Wait for the drawer's visible animation frame before moving focus into it.
    let focusFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() => {
        if (!drawer.contains(document.activeElement)) closeRef.current?.focus();
      });
    });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKey);
      if (main) main.inert = previousMainInert;
      if (header) header.inert = false;
      document.body.style.overflow = previousOverflow;
      if (window.matchMedia("(max-width: 1023px)").matches) menuButton?.focus();
    };
  }, [mobileOpen, isMobile]);

  function toggleSidebar() {
    setCollapsed(current => {
      const next = !current;
      window.localStorage.setItem(sidebarStateKey, String(next));
      return next;
    });
  }

  function toggleGroup(groupId: string) {
    const expandSidebar = collapsed && !isMobile;
    if (expandSidebar) {
      setCollapsed(false);
      window.localStorage.setItem(sidebarStateKey, "false");
    }
    setOpenGroups(current => {
      const next = { ...current, [groupId]: expandSidebar ? true : !current[groupId] };
      window.localStorage.setItem(sidebarGroupsKey, JSON.stringify(next));
      return next;
    });
  }

  function navLink(href: string, label: string, child = false) {
    const Icon = NAV_ICONS[href] ?? LayoutDashboard;
    const active = href === ROUTES.DASHBOARD ? pathname === href : pathname?.startsWith(href);
    return (
      <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined}
        onClick={() => setMobileOpen(false)}
        className={"casha-sidebar__link" + (active ? " is-active" : "") + (child ? " is-child" : "")}>
        <Icon aria-hidden="true" strokeWidth={1.7} />
        <span className="casha-sidebar__copy">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <div ref={headerRef} className="casha-mobile-header">
        <div className="casha-mobile-header__brand">
          <button ref={menuRef} type="button" className="casha-sidebar__icon-button"
            aria-label="Open navigation menu" aria-expanded={mobileOpen} aria-controls={navigationId}
            onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button>
          <Link href={homeRoute} className="casha-sidebar__brand">
            <span className="casha-sidebar__logo">₱</span><span>Casha-Ba</span>
          </Link>
        </div>
      </div>

      {mobileOpen && <button type="button" tabIndex={-1} className="casha-sidebar-backdrop"
        aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />}

      <aside ref={drawerRef} id={navigationId} aria-label={isAdmin ? "Admin navigation" : "Casha-Ba navigation"}
        role={isMobile ? "dialog" : undefined} aria-modal={isMobile && mobileOpen ? true : undefined}
        inert={isMobile && !mobileOpen}
        className={"casha-sidebar" + (mobileOpen ? " is-open" : "") + (collapsed ? " is-collapsed" : "")}>
        <div className="casha-sidebar__header">
          <Link href={homeRoute} title={isAdmin ? "Casha-Ba admin" : "Casha-Ba dashboard"} className="casha-sidebar__brand"
            onClick={() => setMobileOpen(false)}>
            <span className="casha-sidebar__logo">₱</span>
            <span className="casha-sidebar__copy"><strong>Casha-Ba</strong><small>{isAdmin ? "Administration" : "Personal finance"}</small></span>
          </Link>
          <button type="button" onClick={toggleSidebar} className="casha-sidebar__icon-button casha-sidebar__collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </button>
          <button ref={closeRef} type="button" onClick={() => setMobileOpen(false)}
            className="casha-sidebar__icon-button casha-sidebar__close" aria-label="Close navigation menu">
            <X aria-hidden="true" />
          </button>
        </div>

        <ThemeMenuRow />

        <nav aria-label={isAdmin ? "Admin main navigation" : "Main navigation"} className="sidebar-nav casha-sidebar__nav">
          {!isAdmin && navLink(ROUTES.DASHBOARD, "Dashboard")}
          {navigationGroups.map(group => {
            const GroupIcon = GROUP_ICONS[group.id];
            const active = group.items.some(item => pathname?.startsWith(item.href));
            const groupOpen = Boolean(openGroups[group.id]) && (!collapsed || isMobile);
            return (
              <div key={group.id} className="casha-sidebar__group">
                <button type="button" onClick={() => toggleGroup(group.id)} title={group.label}
                  aria-expanded={groupOpen} aria-controls={"sidebar-group-" + group.id}
                  className={"casha-sidebar__link casha-sidebar__group-toggle" + (active ? " has-active-child" : "")}>
                  <GroupIcon aria-hidden="true" strokeWidth={1.7} />
                  <span className="casha-sidebar__copy">{group.label}</span>
                  <ChevronDown aria-hidden="true" className={"casha-sidebar__chevron" + (groupOpen ? " is-expanded" : "")} />
                </button>
                <div id={"sidebar-group-" + group.id} hidden={!groupOpen} className="casha-sidebar__children">
                  {group.items.map(item => navLink(item.href, item.label, true))}
                </div>
              </div>
            );
          })}
          {!isAdmin && <div className="casha-sidebar__secondary">
            {navLink(ROUTES.SUBSCRIPTION, "Casha-Ba Plus")}
            {navLink(ROUTES.SETTINGS, "Settings")}
          </div>}
        </nav>

        {!isAdmin && <TrialNotice />}
        <div className="casha-sidebar__footer">
          <div className="casha-sidebar__profile" title={user?.name ?? "Casha-Ba User"}>
            <div className="casha-sidebar__avatar">
              {user?.avatar ? <Image src={user.avatar} alt="" fill sizes="32px" unoptimized className="object-cover" />
                : user?.name ? user.name[0].toUpperCase() : "C"}
            </div>
            <div className="casha-sidebar__copy">
              <p className="casha-sidebar__user-name">{user?.name ?? "Casha-Ba User"}</p>
              <p className="casha-sidebar__user-role">{isAdmin ? "System Admin" : user?.customRole || user?.role?.[0] || "Personal"}</p>
            </div>
          </div>
          <button type="button" onClick={logout} title="Sign out" aria-label="Sign out" className="casha-sidebar__link">
            <LogOut aria-hidden="true" /><span className="casha-sidebar__copy">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
