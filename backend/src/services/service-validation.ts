/** Pure validation for services (unit-tested, no framework imports). */
import { clean, IMAGE_RE, SLUG_RE, tooLong } from '../common/text';

export type ServiceInput = Partial<Record<'slug' | 'title' | 'short' | 'long' | 'signs' | 'image' | 'imageAlt' | 'imageLabel' | 'published', unknown>>;

/** "other" is reserved for the form's "Other Plumbing Issue" option. */
export const RESERVED_SLUGS = ['other'];

export function validateService(input: ServiceInput) {
  const e: Record<string, string> = {};
  const title = clean(input.title, 80);
  const slug = clean(input.slug, 40).toLowerCase();
  const short = clean(input.short, 300, true);
  const long = clean(input.long, 1200, true);
  const raw = Array.isArray(input.signs) ? input.signs : typeof input.signs === 'string' ? input.signs.split('\n') : [];
  const signs = raw.map((x) => clean(x, 120)).filter(Boolean);
  const image = clean(input.image, 500);
  const published = input.published === true;

  if (title.length < 2) e.title = 'Enter a service title.';
  tooLong(e, 'title', title, 80);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (RESERVED_SLUGS.includes(slug)) e.slug = '“other” is reserved for the form’s “Other Plumbing Issue” option.';
  tooLong(e, 'short', short, 300);
  tooLong(e, 'long', long, 1200);
  if (signs.length > 6) e.signs = 'Use 6 signs or fewer.';
  if (image && !IMAGE_RE.test(image)) e.image = 'Upload an image or use an https:// URL.';
  if (published && short.length < 10) e.short = 'Add a short summary (at least 10 characters) before publishing.';

  return {
    value: {
      title, slug, short, long, signs: signs.slice(0, 6),
      image: image || null, imageAlt: clean(input.imageAlt, 200), imageLabel: clean(input.imageLabel, 160), published,
    },
    errors: e,
  };
}
