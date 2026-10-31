export interface FieldRules {
  required?: boolean; type?: string; min?: string | number; max?: string | number;
  minLength?: number; maxLength?: number; step?: string | number; pattern?: string;
}

export function fieldError(value: string, rules: FieldRules = {}): string {
  const trimmed = value.trim();
  if (!trimmed) return rules.required ? 'This field is required.' : '';
  if (rules.minLength && value.length < rules.minLength) return `Use at least ${rules.minLength} characters.`;
  if (rules.maxLength && value.length > rules.maxLength) return `Use no more than ${rules.maxLength} characters.`;
  if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
  if (rules.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Enter a valid number.';
    if (rules.min !== undefined && number < Number(rules.min)) return `Enter ${rules.min} or more.`;
    if (rules.max !== undefined && number > Number(rules.max)) return `Enter ${rules.max} or less.`;
    if (rules.step !== undefined && rules.step !== 'any') {
      const step = Number(rules.step), start = Number(rules.min ?? 0);
      if (step > 0 && Math.abs((number - start) / step - Math.round((number - start) / step)) > 0.0001) return step === 0.01 ? 'Use at most two decimal places.' : `Use increments of ${step}.`;
    }
  }
  if (rules.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return 'Enter a valid calendar date.';
  if (rules.pattern && !new RegExp(`^(?:${rules.pattern})$`, 'u').test(value)) return 'Use the requested format.';
  return '';
}

export const nameError = (value: string, required = true) => fieldError(value, { required, maxLength: 80 }) ||
  (value.trim() && !/^[\p{L}\p{M} .’'\-]+$/u.test(value.trim()) ? 'Use letters, spaces, apostrophes, periods, or hyphens.' : '');
export const passwordError = (value: string) => fieldError(value, { required: true, minLength: 8, maxLength: 128 }) ||
  (!/[A-Za-z]/.test(value) ? 'Include at least one letter.' : !/\d/.test(value) ? 'Include at least one number.' : '');

export function responseFieldErrors(error: unknown): Record<string, string> {
  const data = (error as { response?: { data?: { fieldErrors?: Record<string, string>; errors?: Array<{ field?: string; path?: Array<string | number>; message?: string }> } } })?.response?.data;
  const issues = Array.isArray(data?.errors) ? data.errors : [];
  return { ...Object.fromEntries(issues.filter(item => (item.field || item.path?.length) && item.message).map(item => [item.field || item.path!.join('.'), item.message!])), ...data?.fieldErrors };
}
