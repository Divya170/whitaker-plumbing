/**
 * Service-area check from the design's checkArea(): matches the visitor's entry against the
 * approved list only (city name, case-insensitive, or an exact 5-digit ZIP) — never distance.
 * Pure function, unit-tested.
 */
export interface AreaRow {
  name: string;
  zips?: string[];
}

export type AreaResult = { kind: 'error' | 'ok' | 'info'; text: string; match?: string };

export function checkArea(query: unknown, areas: AreaRow[]): AreaResult {
  const s = String(query ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!s) return { kind: 'error', text: 'Enter a city, town or ZIP code to check.' };
  const lower = s.toLowerCase().replace(/,?\s*(nc|north carolina)$/i, '').trim();
  const hit = areas.find((a) => a.name.trim().toLowerCase() === lower || (a.zips || []).includes(s));
  if (hit) return { kind: 'ok', text: 'This location is listed as a service area.', match: hit.name };
  if (/^\d{5}$/.test(s)) return { kind: 'info', text: 'Please contact us to confirm service availability.' };
  return { kind: 'info', text: 'We couldn’t verify that location. Contact us to check.' };
}
