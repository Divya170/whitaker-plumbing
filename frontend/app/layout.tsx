import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Whitaker Plumbing — Residential Plumbing Services', template: '%s — Whitaker Plumbing' },
  description: 'Leak repairs, drain cleaning, pipe repairs and water heater services. Call or send a service request describing the problem.',
  openGraph: { title: 'Whitaker Plumbing', description: 'Plumbing problems? Let’s get them sorted. Call or send a service request.' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFDF9' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
