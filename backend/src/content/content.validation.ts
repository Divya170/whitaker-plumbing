import { ContentTypeDef } from './content.schemas';

export type FieldErrors = Record<string, string>;

/** Validate + sanitise `fields` for a content type. Pure function (unit-tested). */
export function validateContentFields(def: ContentTypeDef, input: Record<string, unknown>): { value: Record<string, unknown>; errors: FieldErrors } {
  const value: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const f of def.fields) {
    const raw = input?.[f.key];
    if (f.kind === 'list') {
      const list = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : []).map((x) => String(x ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (f.required && !list.length) errors[f.key] = `Add at least one item to ${f.label.toLowerCase()}.`;
      else if (f.max && list.length > f.max) errors[f.key] = `${f.label}: use ${f.max} items or fewer.`;
      else if (list.some((x) => x.length > 200)) errors[f.key] = `${f.label}: keep each item under 200 characters.`;
      if (!errors[f.key] && def.type === 'service-area' && f.key === 'zips' && list.some((z) => !/^\d{5}$/.test(z)))
        errors[f.key] = 'Enter each ZIP code as 5 digits, one per line.';
      value[f.key] = list;
      continue;
    }
    const s = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim() : raw == null ? '' : String(raw).trim();
    if (f.required && !s) errors[f.key] = `${f.label} is required.`;
    else if (f.max && s.length > f.max) errors[f.key] = `${f.label}: use ${f.max.toLocaleString('en-US')} characters or fewer.`;
    else if (f.kind === 'image' && s && !/^(\/uploads\/|https:\/\/)/.test(s)) errors[f.key] = 'Upload an image or use an https:// URL.';
    else if (f.kind === 'select' && s && !(f.options || []).some((o) => o.value === s)) errors[f.key] = `Choose a valid ${f.label.toLowerCase()}.`;
    value[f.key] = f.kind === 'text' ? s.replace(/\s+/g, ' ') : s;
  }
  return { value, errors };
}
