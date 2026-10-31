"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { fieldError, passwordError } from '@/lib/fieldValidation';

interface PasswordInputProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete: "current-password" | "new-password" | "off";
  placeholder?: string;
  validate?: (value: string) => string;
}

export default function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  validate,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const message = validate?.(value) || (autoComplete === 'new-password' ? passwordError(value) : fieldError(value, { required: true }));
  useLayoutEffect(() => { inputRef.current?.setCustomValidity(message); }, [message]);

  return (
    <div>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          onInvalid={event => { event.preventDefault(); setTouched(true); }}
          aria-label={label || 'Password'}
          aria-invalid={Boolean(touched && message)}
          aria-describedby={touched && message ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={autoComplete === "new-password" ? 8 : undefined}
          required
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          className={`absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            visible
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800"
          }`}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
      {touched && message && <p id={`${id}-error`} className="field-error" role="alert">{message}</p>}
    </div>
  );
}
