"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setError("New passwords don't match.");
      return;
    }
    // Replace with a real "change password" API call when ready.
    router.push(ROUTES.LOGIN);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-brand-900">Change password</h1>
        <p className="mb-6 text-sm text-gray-500">Choose a new password for your account.</p>

        <label className="mb-1 block text-xs font-semibold text-gray-600">Current password</label>
        <input
          className="input mb-4"
          type="password"
          name="current"
          value={form.current}
          onChange={handleChange}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">New password</label>
        <input
          className="input mb-4"
          type="password"
          name="next"
          value={form.next}
          onChange={handleChange}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">Confirm new password</label>
        <input
          className="input mb-2"
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          required
        />

        {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

        <button className="btn-primary mt-4">Update password</button>
      </form>
    </div>
  );
}