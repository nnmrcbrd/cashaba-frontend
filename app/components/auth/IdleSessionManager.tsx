"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import { useAuth } from "@/context/Authcontext";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_DURATION_MS = 60 * 1000;
const LAST_ACTIVITY_KEY = "casha_last_activity";

export default function IdleSessionManager() {
  const { isAuthenticated, loading, logout } = useAuth();
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef(0);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const endIdleSession = useCallback(() => {
    window.sessionStorage.setItem(
      "casha_auth_notice",
      "You were signed out after 15 minutes of inactivity.",
    );
    void logout();
  }, [logout]);

  const scheduleTimers = useCallback(
    (lastActivity: number) => {
      clearTimers();
      const elapsed = Date.now() - lastActivity;
      const remaining = IDLE_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        endIdleSession();
        return;
      }

      deadlineRef.current = Date.now() + remaining;
      setWarningOpen(remaining <= WARNING_DURATION_MS);
      setSecondsRemaining(Math.max(1, Math.ceil(remaining / 1000)));

      if (remaining > WARNING_DURATION_MS) {
        warningTimerRef.current = setTimeout(() => {
          setWarningOpen(true);
          setSecondsRemaining(60);
        }, remaining - WARNING_DURATION_MS);
      }

      logoutTimerRef.current = setTimeout(endIdleSession, remaining);
    },
    [clearTimers, endIdleSession],
  );

  const registerActivity = useCallback(() => {
    if (!isAuthenticated) return;
    const now = Date.now();
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    scheduleTimers(now);
  }, [isAuthenticated, scheduleTimers]);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      clearTimers();
      return;
    }

    const storedActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
    const lastActivity = Number.isFinite(storedActivity) && storedActivity > 0
      ? storedActivity
      : Date.now();
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
    const initializationFrame = window.requestAnimationFrame(() => {
      scheduleTimers(lastActivity);
    });

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, registerActivity, { passive: true }),
    );

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return;
      const timestamp = Number(event.newValue);
      if (Number.isFinite(timestamp)) scheduleTimers(timestamp);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const timestamp = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
      scheduleTimers(Number.isFinite(timestamp) ? timestamp : Date.now());
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(initializationFrame);
      clearTimers();
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, registerActivity),
      );
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    clearTimers,
    isAuthenticated,
    loading,
    registerActivity,
    scheduleTimers,
  ]);

  useEffect(() => {
    if (!warningOpen) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining(
        Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [warningOpen]);

  if (!warningOpen || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-session-title"
        className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Clock3 className="h-6 w-6" />
        </div>
        <h2 id="idle-session-title" className="text-xl font-bold tracking-tight text-slate-950">
          Are you still there?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          For your security, Casha-Ba will sign you out in{" "}
          <strong className="text-slate-950">{secondsRemaining} seconds</strong>{" "}
          because there has been no activity.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign out now
          </button>
          <button
            type="button"
            onClick={registerActivity}
            className="rounded-xl bg-[#0b6b4f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084f3b]"
          >
            Stay signed in
          </button>
        </div>
      </section>
    </div>
  );
}
