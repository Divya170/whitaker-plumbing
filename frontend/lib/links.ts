/** Link to the request form, optionally with the service preselected (design: #/contact?service=leak). */
export function requestHref(service?: string) {
  return service ? `/contact?service=${encodeURIComponent(service)}` : '/contact';
}

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About / FAQs', href: '/about' },
  { label: 'Service Areas', href: '/service-areas' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Dot colours for services 1–4 (repeat for more). */
export const DOTS = ['#2A8C7E', '#1F5FAD', '#B7791F', '#C2553A'];
export const dotFor = (i: number) => DOTS[i % DOTS.length];

/** Analytics hook (design pushes to window.dataLayer). No-op unless a tag manager defines dataLayer. */
export function track(event: string, data?: Record<string, unknown>) {
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...(data || {}) });
  } catch {
    /* ignore */
  }
}
