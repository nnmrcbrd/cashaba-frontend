"use client";

import { useId, useLayoutEffect, useRef, useState, type FormHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { fieldError } from '@/lib/fieldValidation';

type Extra = { validate?: (value: string) => string; error?: string };

export function ValidatedForm({ onSubmit, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} noValidate onSubmit={event => {
    const controls = Array.from(event.currentTarget.elements).filter((control): control is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement);
    const invalid = controls.filter(control => control.willValidate && !control.checkValidity());
    if (invalid.length) { event.preventDefault(); invalid[0].focus(); return; }
    onSubmit?.(event);
  }} />;
}

export function ValidatedInput({ validate, error, onBlur, onInvalid, onChange, ...props }: InputHTMLAttributes<HTMLInputElement> & Extra) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const ref = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(props.value ?? props.defaultValue ?? ''));
  const value = String(props.value ?? currentValue);
  const message = error || validate?.(value) || fieldError(value, props);
  useLayoutEffect(() => { ref.current?.setCustomValidity(message); }, [message]);
  const shown = Boolean(message && (touched || error));
  return <div className="validated-control"><input {...props} id={id} ref={ref}
    aria-invalid={shown || props['aria-invalid']} aria-describedby={[props['aria-describedby'], shown ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
    onChange={event => { setCurrentValue(event.target.value); onChange?.(event); }}
    onBlur={event => { setTouched(true); onBlur?.(event); }}
    onInvalid={event => { event.preventDefault(); setTouched(true); onInvalid?.(event); }} />
    {shown && <p id={`${id}-error`} className="field-error" role="alert">{message}</p>}
  </div>;
}

export function ValidatedSelect({ error, onBlur, onInvalid, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const ref = useRef<HTMLSelectElement>(null);
  const [touched, setTouched] = useState(false);
  const message = error || fieldError(String(props.value ?? ''), { required: props.required });
  useLayoutEffect(() => { ref.current?.setCustomValidity(message); }, [message]);
  const shown = Boolean(message && (touched || error));
  return <div className="validated-control"><select {...props} id={id} ref={ref} aria-invalid={shown}
    aria-describedby={[props['aria-describedby'], shown ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
    onBlur={event => { setTouched(true); onBlur?.(event); }} onInvalid={event => { event.preventDefault(); setTouched(true); onInvalid?.(event); }} />
    {shown && <p id={`${id}-error`} className="field-error" role="alert">{message}</p>}
  </div>;
}
