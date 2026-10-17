/** Small sanitising helpers shared by the pure validators (no framework imports). */

/** Strip control characters (keeps newlines when multiline), trim, cap at max+1 so length checks still fire. */
export const clean = (v: unknown, max: number, multiline = false) =>
  String(v ?? '')
    .replace(multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max + 1);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMAGE_RE = /^(\/uploads\/[\w.-]+|https:\/\/\S+)$/;

export function tooLong(e: Record<string, string>, key: string, v: string, max: number, label = 'Use') {
  if (v.length > max) e[key] = `${label} ${max.toLocaleString('en-US')} characters or fewer.`;
}

/** Email pattern used by the design's forms. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
