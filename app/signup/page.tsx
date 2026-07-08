"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Replace with a real signup API call when ready.
    router.push(ROUTES.ONBOARDING_ROLE);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-brand-900">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500">Start tracking your money in minutes.</p>

        <label className="mb-1 block text-xs font-semibold text-gray-600">Full name</label>
        <input
          className="input mb-4"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
        <input
          className="input mb-4"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">Password</label>
        <input
          className="input mb-6"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button className="btn-primary">Create account</button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}