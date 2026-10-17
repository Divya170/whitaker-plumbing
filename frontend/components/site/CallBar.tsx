'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { track } from '@/lib/links';

/** Mobile/tablet sticky "Call / Request Service" bar (design: below 960px, hidden on Contact and while the menu is open). */
export function CallBar({ telHref, enabled }: { telHref: string | null; enabled: boolean }) {
  const pathname = usePathname() || '/';
  const show = enabled && !!telHref && !pathname.startsWith('/contact');
  useEffect(() => {
    document.body.classList.toggle('has-callbar', show);
    return () => document.body.classList.remove('has-callbar');
  }, [show]);
  if (!show) return null;
  return (
    <div className="callbar">
      <a href={telHref!} onClick={() => track('phone_click')}>
        Call
      </a>
      <Link href="/contact" onClick={() => track('request_service_click')}>
        Request Service
      </Link>
    </div>
  );
}
