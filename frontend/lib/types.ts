export interface PublicSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  address: string;
  mapsHref: string | null;
  /** Address quoted in TO CONFIRM tags while it awaits approval (only while flags are on). */
  pendingAddress: string;
  showAddress: boolean;
  tagline: string;
  credentials: string;
  hours: string;
  emergencyInfo: string;
  followUpNote: string;
  about: string;
  privacyNotice: string;
  reviewNote: string;
  showContentFlags: boolean;
  mobileCallBar: boolean;
  requestsOpen: boolean;
}

export interface Service {
  id: number;
  num: string;
  slug: string;
  title: string;
  short: string;
  long: string;
  signs: string[];
  image: string | null;
  imageAlt: string;
  imageLabel: string;
}

export interface Faq {
  id: number;
  q: string;
  a: string;
  pending: boolean;
  home: boolean;
}
export interface TitledText {
  id: number;
  title: string;
  body: string;
}
export interface Area {
  id: number;
  name: string;
}

export type SiteImages = Record<string, { url: string; alt: string } | undefined>;

export interface SiteData {
  settings: PublicSettings;
  services: Service[];
  faqs: Faq[];
  benefits: TitledText[];
  assurances: string[];
  steps: TitledText[];
  tips: string[];
  areas: Area[];
  images: SiteImages;
}

export type Opt = { value: string; label: string };
export interface FormOptions {
  services: Opt[];
  windows: Opt[];
  today: string;
  open: boolean;
}

export interface AreaResult {
  kind: 'error' | 'ok' | 'info';
  text: string;
}

export interface SubmitResult {
  ok: true;
  id?: string;
  service?: string;
  location?: string;
  preferredDate?: string | null;
  preferredWindow?: string;
}

// ---------- admin ----------

export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'completed' | 'closed' | 'spam';

export interface Lead {
  id: number;
  publicRef: string | null;
  name: string;
  phoneE164: string;
  phone: string;
  email: string;
  service: string;
  serviceLabel: string;
  issue: string;
  location: string;
  preferredDate: string | null;
  preferredWindow: string;
  windowLabel: string;
  extra: string;
  status: LeadStatus;
  statusLabel: string;
  notes: string;
  userAgent: string;
  notifyStatus: 'pending' | 'sent' | 'failed' | 'disabled';
  notifyAttempts: number;
  notifyError: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadList {
  items: Lead[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<string, number>;
  services: Opt[];
  notificationsConfigured: boolean;
  retentionMonths: number;
}

export interface AdminService {
  id: number;
  slug: string;
  title: string;
  short: string;
  long: string;
  signs: string[];
  image: string | null;
  imageAlt: string;
  imageLabel: string;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  options?: Opt[];
  help?: string;
}
export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  uniqueBy?: string;
}
export interface AdminContentItem {
  id: number;
  type: string;
  sortOrder: number;
  fields: Record<string, unknown>;
  published: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  showAddress: boolean;
  tagline: string;
  credentials: string;
  hours: string;
  emergencyInfo: string;
  followUpNote: string;
  about: string;
  privacyNotice: string;
  reviewNote: string;
  showContentFlags: boolean;
  mobileCallBar: boolean;
  requestsOpen: boolean;
  updatedAt: string;
}
