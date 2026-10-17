/**
 * Registry of the generic content types on the Whitaker Plumbing site. The backend
 * validates against these and serves them to the admin UI, which builds its
 * forms from them.
 */

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** characters (text) or items (list) */
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  /** only one published row per value of this field (page photos: one per slot) */
  uniqueBy?: string;
}

const yesNo = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const IMAGE_SLOTS = [
  { value: 'hero', label: 'Home hero — plumber working under a residential sink, natural light' },
  { value: 'why', label: 'Home “Why Whitaker” — water heater inspection, utility room' },
  { value: 'services-hero', label: 'Services intro — tools laid out on a work mat' },
  { value: 'services-detail', label: 'Services intro (round inset) — close-up of a pipe fitting' },
  { value: 'about-wide', label: 'About — wide photo of a clean residential utility room' },
];

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: 'faq', label: 'FAQs', page: 'Home (preview), About / FAQs', titleField: 'q',
    description:
      'Questions and answers. Leave the answer empty while it is pending: the site shows “Answer to be provided by Whitaker Plumbing.” only while review flags are on, and hides the question once they are off. “Show on home” picks the home-page preview (the design shows four).',
    fields: [
      { key: 'q', label: 'Question', kind: 'text', required: true, max: 200 },
      { key: 'a', label: 'Answer (empty = pending)', kind: 'textarea', max: 1500 },
      { key: 'home', label: 'Show on home', kind: 'select', required: true, options: yesNo },
    ],
  },
  {
    type: 'benefit', label: 'Why Whitaker Plumbing', page: 'Home — “Clear Communication. Practical Plumbing Help.”', titleField: 'title',
    description: 'The numbered list beside the water-heater photo.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 80 },
      { key: 'body', label: 'Text', kind: 'textarea', required: true, max: 300 },
    ],
  },
  {
    type: 'assurance', label: 'Hero assurances', page: 'Home — under the hero', titleField: 'text',
    description: 'The short ticked lines under the hero (“Call or request online”, …).',
    fields: [{ key: 'text', label: 'Text', kind: 'text', required: true, max: 60 }],
  },
  {
    type: 'step', label: 'How service requests work', page: 'About / FAQs', titleField: 'title',
    description: 'The numbered steps on the About page.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 80 },
      { key: 'body', label: 'Text', kind: 'textarea', required: true, max: 300 },
    ],
  },
  {
    type: 'tip', label: 'Helpful details to include', page: 'Contact — side panel', titleField: 'text',
    description: 'Bullet points beside the request form.',
    fields: [{ key: 'text', label: 'Text', kind: 'text', required: true, max: 160 }],
  },
  {
    type: 'service-area', label: 'Service areas', page: 'Home (area check), Service Areas', titleField: 'name',
    description:
      'Approved cities or towns, each with its ZIP codes. The area check matches a visitor’s entry against this list only — never distance from the address. Empty list = “No service locations are listed yet.”',
    fields: [
      { key: 'name', label: 'City or town', kind: 'text', required: true, max: 80 },
      { key: 'zips', label: 'ZIP codes (one per line, 5 digits)', kind: 'list', max: 100, help: 'e.g. 28202' },
    ],
  },
  {
    type: 'site-image', label: 'Page photos', page: 'Home, Services, About', titleField: 'slot', uniqueBy: 'slot',
    description: 'Photos for the design’s image slots. Until a photo is added the site shows the labelled placeholder. Service photos are set on each service.',
    fields: [
      { key: 'slot', label: 'Slot', kind: 'select', required: true, options: IMAGE_SLOTS },
      { key: 'image', label: 'Photo', kind: 'image', required: true },
      { key: 'alt', label: 'Alt text (describe the photo)', kind: 'text', required: true, max: 200 },
    ],
  },
];

export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map((t) => [t.type, t]));
