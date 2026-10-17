/** Admin list format (design fmt): "Oct 13, 4:32 PM". */
export function formatShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** "2026-10-20" → "Tue, Oct 20" without timezone shifts (design receipt format). */
export function formatDay(iso: string | null | undefined, withYear = false): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
}

export const paragraphs = (s: string) =>
  (s || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const STATUS_ORDER = ['new', 'contacted', 'in_progress', 'completed', 'closed'] as const;
export const STATUS_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', in_progress: 'In Progress', completed: 'Completed', closed: 'Closed', spam: 'Spam' };
export const WINDOW_LABEL: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', flexible: 'Flexible' };
export const NOTIFY_TEXT: Record<string, string> = {
  disabled: 'Email provider not configured. The lead is stored; notification outcome is recorded separately so delivery can be retried once a provider is set up.',
  pending: 'Notification email queued. It is retried automatically if delivery fails.',
  sent: 'Notification email sent to the business.',
  failed: 'Notification email failed. It is retried automatically, or you can retry now.',
};

/** "Tue, Oct 20, Morning" — preferred time line used on the receipt and in the admin. */
export const preferredTime = (date: string | null | undefined, window: string) =>
  [date ? formatDay(date) : '', WINDOW_LABEL[window] || window || '—'].filter(Boolean).join(', ');
