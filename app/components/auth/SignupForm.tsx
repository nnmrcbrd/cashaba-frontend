"use client";
import { ValidatedForm, ValidatedInput, ValidatedSelect } from "@/app/components/ui/ValidatedForm";

import { useState } from "react";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/Authcontext";
import PasswordInput from "./PasswordInput";
import { EmailOtpForm } from "./EmailOtpForm";
import { nameError } from '@/lib/fieldValidation';

export default function SignupForm() {
  const { signup, signupError, signupFieldErrors, clearSignupFieldError } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{ email: string; challengeId: string } | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEmailTouched(true);
    setLocalError("");
    if (!emailValid) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (!Object.values(passwordChecks).every(Boolean)) {
      setLocalError("Please meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const successful = await signup(firstName.trim(), middleName.trim(), lastName.trim(), email.trim(), password, gender);
    setLoading(false);
    if (successful) setVerification(successful);
  }

  if (verification) return <EmailOtpForm purpose="verification" initialEmail={verification.email} initialChallengeId={verification.challengeId} />;

  return (
    <ValidatedForm onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-semibold text-slate-700">First name</label>
          <ValidatedInput id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} validate={nameError} maxLength={80} autoComplete="given-name" required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" />
        </div>
         <div>
          <label htmlFor="middleName" className="mb-1.5 block text-sm font-semibold text-slate-700">Middle name <span className="font-normal text-slate-500">(optional)</span></label>
          <ValidatedInput id="middleName" value={middleName} onChange={(event) => setMiddleName(event.target.value)} validate={value => nameError(value, false)} maxLength={80} autoComplete="additional-name" className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-semibold text-slate-700">Last name</label>
          <ValidatedInput id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} validate={nameError} maxLength={80} autoComplete="family-name" required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="gender" className="mb-1.5 block text-sm font-semibold text-slate-700">Gender</label>
          <ValidatedSelect id="gender" value={gender} onChange={(event) => setGender(event.target.value)} required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10">
            <option value="" disabled>Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </ValidatedSelect>
        </div>

        <div>
          <label htmlFor="signupEmail" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
          <ValidatedInput
            id="signupEmail"
            error={signupFieldErrors.email}
            type="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); clearSignupFieldError('email'); }}
            onBlur={() => setEmailTouched(true)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={emailTouched && !emailValid}
            required
            className={`h-12 w-full rounded-xl border px-4 text-sm outline-none placeholder:text-slate-400 focus:ring-4 ${
              emailTouched && !emailValid
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : "border-slate-300 focus:border-[#0b6b4f] focus:ring-emerald-600/10"
            }`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordInput id="signupPassword" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Create password" />
        <div>
          <PasswordInput id="confirmPassword" label="Confirm password" value={confirmPassword} validate={value => value !== password ? 'Passwords do not match.' : ''} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Type it again" />
        </div>
      </div>

      <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
        {[
          { label: "8+ characters", valid: passwordChecks.length },
          { label: "One letter", valid: passwordChecks.letter },
          { label: "One number", valid: passwordChecks.number },
        ].map((check) => (
          <span key={check.label} className={`flex items-center gap-1.5 ${check.valid ? "text-emerald-700" : ""}`}>
            <Check size={14} /> {check.label}
          </span>
        ))}
      </div>

      {(localError || signupError) && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          {localError || signupError}
        </div>
      )}

      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white transition hover:bg-[#084f3b] disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? "Creating account..." : "Create account"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </ValidatedForm>
  );
}
