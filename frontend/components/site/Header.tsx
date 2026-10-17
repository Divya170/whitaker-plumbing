'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV, track } from '@/lib/links';
import { Logo } from './Logo';

export function Header({ name, phone, telHref }: { name: string; phone: string | null; telHref: string | null }) {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close on navigation; Esc closes and returns focus to the Menu button (design onKey).
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const onCall = () => track('phone_click');
  const onRequest = () => track('request_service_click');

  return (
    <header className={`hdr${scrolled ? ' is-scrolled' : ''}`}>
      <div className="wrap hdr__in">
        <Logo name={name} />
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href) ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hdr__actions">
          {telHref && (
            <a href={telHref} className="hdr__call" onClick={onCall}>
              <span className="dot" aria-hidden="true" />
              <span className="full">Call {phone}</span>
              <span className="short">Call</span>
            </a>
          )}
          <Link href="/contact" className="btn btn-blue btn--sm" style={{ boxShadow: 'none', padding: '0 20px' }} onClick={onRequest}>
            Request Service
          </Link>
        </div>
        <div className="hdr__narrow">
          {telHref && (
            <a href={telHref} className="hdr__callbtn" onClick={onCall}>
              Call
            </a>
          )}
          <button ref={btn} type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
            <i aria-hidden="true">
              <span />
              <span />
              <span />
            </i>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="mmenu">
          <nav aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={current(n.href) ? 'page' : undefined}>
                {n.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
            <div className="mmenu__ctas">
              <Link href="/contact" className="btn btn-blue" onClick={onRequest}>
                Request Service
              </Link>
              {telHref && (
                <a href={telHref} className="btn btn-outline" onClick={onCall}>
                  Call {phone}
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
