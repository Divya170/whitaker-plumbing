/**
 * Server-side data access for public pages (React Server Components).
 * Uncached so admin edits appear immediately.
 */
import type { FormOptions, SiteData } from './types';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api${path}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(503, 'The site service is unavailable. Please try again shortly.');
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Business details, flags, services, FAQs, copy, service areas and page photos. */
export const getSite = () => get<SiteData>('/site');

/** Option lists + today's date for the service-request form. */
export const getFormOptions = () => get<FormOptions>('/service-requests/options');
