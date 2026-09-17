import Link from "next/link";
import { ROUTES } from "@/constants";

export default function AuthSwitcher({ active }: { active: "login" | "signup" }) {
  return (
    <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
      <Link
        href={ROUTES.LOGIN}
        aria-current={active === "login" ? "page" : undefined}
        className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all ${
          active === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Sign in
      </Link>
      <Link
        href={ROUTES.SIGNUP}
        aria-current={active === "signup" ? "page" : undefined}
        className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all ${
          active === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Create account
      </Link>
    </div>
  );
}
