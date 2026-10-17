/**
 * Service-request rules from the design's validateField() — pure, unit-tested.
 * Messages are the design's exact wording; the frontend mirrors them in lib/validation.ts.
 */

export const PREFERRED_WINDOWS = ['morning', 'afternoon', 'flexible'] as const;
export const WINDOW_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', flexible: 'Flexible' };

/** Design statuses: New · Contacted · In Progress · Completed · Closed (+ spam, hidden by default). */
export const LEAD_STATUSES = ['new', 'contacted', 'in_progress', 'completed', 'closed', 'spam'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  spam: 'Spam',
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[\d\s().\-]+$/;

/** Field order used by the error summary (design ORDER). */
export const FIELD_ORDER = ['name', 'phone', 'email', 'service', 'issue', 'location', 'preferredDate', 'preferredWindow'] as const;

/** Business time zone for "today" (the business is in Charlotte, NC). */
export const BUSINESS_TZ = process.env.BUSINESS_TZ || 'America/New_York';

export function todayIso(now = new Date(), tz = BUSINESS_TZ): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function isRealDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Normalises to E.164: 10 digits → +1…, 11 digits starting with 1 → +…, a leading + keeps the country code. */
export function toE164(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s || !PHONE_CHARS_RE.test(s)) return null;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  if (s.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

/** "+16028333185" → "+1 (602) 833-3185"; other numbers are returned as-is. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
/** Strip control characters; keep newlines only where allowed. */
const tidy = (v: unknown, multiline = false) =>
  str(v)
    .replace(multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

export type RequestInput = Partial<
  Record<'name' | 'phone' | 'email' | 'service' | 'issue' | 'location' | 'preferredDate' | 'preferredWindow' | 'extra' | 'company', unknown>
>;

/** Honeypot field `company` (hidden "Company (leave blank)"): answered with a fake success and discarded. */
export const isHoneypot = (input: RequestInput) => str(input?.company).trim() !== '';

/** A location that is only digits must be a 5-digit ZIP (design's server-validation example). */
export function locationError(location: string): string | null {
  if (!location) return 'Enter your city, town or ZIP code.';
  if (location.length < 2) return 'Enter a city, town or 5-digit ZIP code.';
  if (/^[\d\s-]+$/.test(location) && !/^\d{5}(-\d{4})?$/.test(location.replace(/\s/g, '')))
    return 'We couldn’t recognise this location. Enter a city name or a 5-digit ZIP code.';
  return null;
}

export function validateRequest(input: RequestInput, ctx: { services: string[]; today?: string }) {
  const e: Record<string, string> = {};
  const name = tidy(input.name).replace(/\s+/g, ' ');
  const phoneRaw = tidy(input.phone);
  const email = tidy(input.email).toLowerCase();
  const service = str(input.service).trim();
  const issue = tidy(input.issue, true);
  const location = tidy(input.location).replace(/\s+/g, ' ');
  const dateRaw = str(input.preferredDate).trim();
  const preferredWindow = str(input.preferredWindow).trim();
  const extra = tidy(input.extra, true);

  if (!name) e.name = 'Enter your name.';
  else if (name.length < 2) e.name = 'Name should be at least 2 characters.';
  else if (name.length > 80) e.name = 'Use 80 characters or fewer.';

  const digits = phoneRaw.replace(/\D/g, '');
  if (!phoneRaw) e.phone = 'Enter a phone number so we can reach you.';
  else if (!PHONE_CHARS_RE.test(phoneRaw)) e.phone = 'Use digits, spaces, brackets, dashes or a leading +.';
  else if (digits.length < 7 || digits.length > 15) e.phone = 'Enter a phone number with 7 to 15 digits.';

  if (!email) e.email = 'Enter your email address.';
  else if (email.length > 120 || !EMAIL_RE.test(email)) e.email = 'Enter an email address like name@example.com.';

  if (!service || !ctx.services.includes(service)) e.service = 'Choose a service type, or “Other Plumbing Issue.”';

  if (!issue) e.issue = 'Describe the issue in a few words.';
  else if (issue.length < 10) e.issue = 'Add a little more detail (at least 10 characters).';
  else if (issue.length > 1500) e.issue = 'Keep the description to 1,500 characters or fewer.';

  const locErr = locationError(location);
  if (locErr) e.location = locErr;
  else if (location.length > 80) e.location = 'Use 80 characters or fewer.';

  let preferredDate: string | null = null;
  if (dateRaw) {
    if (!isRealDate(dateRaw)) e.preferredDate = 'Enter a valid date.';
    else if (dateRaw < (ctx.today || todayIso())) e.preferredDate = 'Choose today or a later date.';
    else preferredDate = dateRaw;
  }

  if (!(PREFERRED_WINDOWS as readonly string[]).includes(preferredWindow)) e.preferredWindow = 'Choose a preferred time of day.';

  if (extra.length > 1500) e.extra = 'Keep this to 1,500 characters or fewer.';

  return {
    value: {
      name: name.slice(0, 80),
      phoneE164: toE164(phoneRaw) || '',
      email: email.slice(0, 120),
      service,
      issue: issue.slice(0, 1500),
      location: location.slice(0, 80),
      preferredDate,
      preferredWindow,
      extra: extra.slice(0, 1500),
    },
    errors: e,
  };
}

/** Public reference from the row id, in the design's format: WP-1101, WP-1102, … */
export function publicRef(id: number): string {
  return `WP-${1100 + id}`;
}

/** CSV cell, quoted, with spreadsheet-formula injection neutralised. */
export function csvSafe(v: unknown): string {
  let x = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(x)) x = `'${x}`;
  return `"${x.replace(/"/g, '""')}"`;
}
