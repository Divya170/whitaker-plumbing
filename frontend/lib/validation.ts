/**
 * Client mirror of the design's validateField() and backend/src/leads/request-validation.ts.
 * The API re-validates everything and returns 422 with the same messages.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface RequestForm {
  name: string;
  phone: string;
  email: string;
  service: string;
  issue: string;
  location: string;
  date: string;
  window: string;
  extra: string;
  company: string; // honeypot
}

export type FieldKey = 'name' | 'phone' | 'email' | 'service' | 'issue' | 'location' | 'date' | 'window';

export const EMPTY: RequestForm = { name: '', phone: '', email: '', service: '', issue: '', location: '', date: '', window: '', extra: '', company: '' };

/** Design ORDER + LABELS (error summary reads "Label: message"). */
export const ORDER: FieldKey[] = ['name', 'phone', 'email', 'service', 'issue', 'location', 'date', 'window'];
export const LABELS: Record<FieldKey, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  service: 'Service type',
  issue: 'Issue description',
  location: 'City or ZIP code',
  date: 'Preferred date',
  window: 'Preferred time of day',
};
/** Element each summary link focuses. */
export const FIELD_ID: Record<FieldKey, string> = {
  name: 'f-name',
  phone: 'f-phone',
  email: 'f-email',
  service: 'f-service',
  issue: 'f-issue',
  location: 'f-location',
  date: 'f-date',
  window: 'w-morning',
};
/** API field names → form keys. */
export const API_KEY: Record<string, FieldKey> = { preferredDate: 'date', preferredWindow: 'window' };

export function validateField(k: FieldKey, v: string, ctx: { services: string[]; today: string }): string {
  const s = (v || '').trim();
  switch (k) {
    case 'name':
      if (!s) return 'Enter your name.';
      if (s.length < 2) return 'Name should be at least 2 characters.';
      if (s.length > 80) return 'Use 80 characters or fewer.';
      return '';
    case 'phone': {
      if (!s) return 'Enter a phone number so we can reach you.';
      if (!/^\+?[\d\s().\-]+$/.test(s)) return 'Use digits, spaces, brackets, dashes or a leading +.';
      const d = s.replace(/\D/g, '');
      if (d.length < 7 || d.length > 15) return 'Enter a phone number with 7 to 15 digits.';
      return '';
    }
    case 'email':
      if (!s) return 'Enter your email address.';
      if (s.length > 120 || !EMAIL_RE.test(s)) return 'Enter an email address like name@example.com.';
      return '';
    case 'service':
      return ctx.services.includes(s) ? '' : 'Choose a service type, or “Other Plumbing Issue.”';
    case 'issue':
      if (!s) return 'Describe the issue in a few words.';
      if (s.length < 10) return 'Add a little more detail (at least 10 characters).';
      if (s.length > 1500) return 'Keep the description to 1,500 characters or fewer.';
      return '';
    case 'location':
      if (!s) return 'Enter your city, town or ZIP code.';
      if (s.length < 2) return 'Enter a city, town or 5-digit ZIP code.';
      if (/^[\d\s-]+$/.test(s) && !/^\d{5}(-\d{4})?$/.test(s.replace(/\s/g, ''))) return 'We couldn’t recognise this location. Enter a city name or a 5-digit ZIP code.';
      if (s.length > 80) return 'Use 80 characters or fewer.';
      return '';
    case 'date':
      return s && s < ctx.today ? 'Choose today or a later date.' : '';
    case 'window':
      return s ? '' : 'Choose a preferred time of day.';
  }
}

export function validateAll(f: RequestForm, ctx: { services: string[]; today: string }) {
  const e: Partial<Record<FieldKey, string>> = {};
  for (const k of ORDER) {
    const m = validateField(k, f[k], ctx);
    if (m) e[k] = m;
  }
  return e;
}
