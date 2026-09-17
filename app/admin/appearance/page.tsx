"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Moon, Palette, Sun } from "lucide-react";
import AdminSidebar from "@/app/components/ui/AdminSidebar";
import { ROUTES } from "@/constants";
import { useAuth } from "@/context/Authcontext";
import { useTheme } from "@/context/ThemeContext";

const THEMES = [
  {
    id: "light",
    label: "Light",
    description: "Clean white interface",
    icon: Sun,
    preview: "bg-[#f7f9f8] border-gray-200",
    line: "bg-slate-200",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
    preview: "bg-[#191919] border-[#333333]",
    line: "bg-[#8b8d91]",
  },
  {
    id: "amoled",
    label: "AMOLED",
    description: "Pure black for OLED",
    icon: Palette,
    preview: "bg-black border-[#202020]",
    line: "bg-[#8b8d91]",
  },
] as const;

export default function AdminAppearancePage() {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.accountRole !== "ADMIN") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [authLoading, router, user]);

  return (
    <div className="flex min-h-screen font-sans">
      <AdminSidebar />
      <main className="app-main">
        <div className="app-page-header mb-6">
          <h1 className="uppercase">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Customize your administrator workspace.</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            <span className="relative border-b-2 border-[#16815d] pb-3 text-xs font-bold text-[#16815d]">
              Appearance
            </span>
          </div>
        </div>

        <section className="rounded-3xl border border-gray-200/90 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#16815d]">Appearance</h2>
            <p className="mt-1 text-xs text-gray-500">Choose your preferred admin dashboard theme.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {THEMES.map((option) => {
              const Icon = option.icon;
              const active = theme === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={active}
                  className={`relative rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 ${
                    active
                      ? "border-[#16815d] shadow-sm"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  {active && (
                    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#16815d] px-2 py-1 text-[9px] font-bold text-white">
                      <Check size={10} aria-hidden="true" />
                      Active
                    </span>
                  )}

                  <div
                    data-theme-preview={option.id}
                    className={`mb-3 flex h-20 items-center justify-center gap-2 rounded-lg border ${option.preview}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className={`h-2 w-10 rounded-full ${option.line}`} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Icon size={13} className="text-emerald-600" aria-hidden="true" />
                    <span>{option.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">{option.description}</p>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] text-gray-500">
            Theme preference is saved locally and applied instantly across all admin pages.
          </p>
        </section>
      </main>
    </div>
  );
}
