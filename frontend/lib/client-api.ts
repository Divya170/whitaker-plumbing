'use client';

/**
 * Browser-side API helper. Calls go to same-origin /api/* (proxied to NestJS by
 * next.config.js), so the admin session travels as an HttpOnly cookie.
 * Mutations send the CSRF token (readable wp_csrf cookie) as X-CSRF-Token.
 */

const CSRF_COOKIE = 'wp_csrf';

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string> = {},
    public code = '',
  ) {
    super(message);
  }
}

function readCookie(name: string): string {
  try {
    const m = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
  } catch {
    return '';
  }
}

/** True when a CSRF cookie exists — a cheap hint that a session may exist (the server decides). */
export const hasSessionHint = () => !!readCookie(CSRF_COOKIE);

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  admin?: boolean;
  timeoutMs?: number;
  form?: FormData;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const method = opts.method || 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    throw new ClientApiError(0, aborted ? 'The request timed out. Please try again.' : 'Network error — check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && opts.admin && typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const d = (data || {}) as { message?: string | string[]; errors?: Record<string, string>; error?: string };
    const msg = Array.isArray(d.message) ? d.message[0] : d.message || d.error || `Request failed (${res.status})`;
    if (res.status === 429) throw new ClientApiError(429, 'Too many attempts. Please wait a few minutes and try again.', {}, 'rate_limited');
    throw new ClientApiError(res.status, msg, d.errors || {}, d.error || '');
  }
  return data as T;
}

/** Upload an image (admin). Returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const r = await api<{ url: string }>('/uploads/admin', { method: 'POST', form, admin: true, timeoutMs: 60000 });
  return r.url;
}

/** Download a CSV (admin) using the session cookie. */
export async function downloadCsv(path: string, filename: string) {
  const res = await fetch(`/api${path}`, { credentials: 'same-origin' });
  if (!res.ok) throw new ClientApiError(res.status, 'Export failed. Please try again.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
