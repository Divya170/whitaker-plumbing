'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client-api';
import { AdminProvider } from '@/components/admin/AdminContext';

const NAV = [
  { href: '/admin/leads', label: 'Leads', badge: true },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/content', label: 'FAQs, areas & photos' },
  { href: '/admin/settings', label: 'Business & settings' },
  { href: '/admin/account', label: 'Account' },
];

type Admin = { id: number; email: string; name: string };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  // The session lives in an HttpOnly cookie, so the server is asked on every load.
  useEffect(() => {
    api<Admin>('/admin-auth/me')
      .then((a) => {
        setAdmin(a);
        setChecking(false);
      })
      .catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCounts = useCallback(() => {
    api<Record<string, number>>('/admin/leads/counts', { admin: true })
      .then((c) => setNewCount(c.new || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!admin) return;
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000);
    return () => clearInterval(t);
  }, [admin, refreshCounts]);

  useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    try {
      await api('/admin-auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
    }
  };

  if (checking) {
    return (
      <main className="login-wrap adm-root" aria-busy="true">
        <div className="login-card" style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <span className="spin spin--dark" />
          <span className="small">Checking your session…</span>
        </div>
      </main>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <AdminProvider admin={admin} newCount={newCount} refreshCounts={refreshCounts}>
      <div className="adm adm-root">
        <header className="adm-top">
          <Link href="/admin/leads">Whitaker · Leads</Link>
          <button type="button" className="adm-menubtn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="adm-side">
            Menu
          </button>
        </header>
        <aside id="adm-side" className={`adm-side${open ? ' is-open' : ''}`} aria-label="Admin navigation">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <Link href="/admin/leads" className="adm-brand">
              <span className="amark" aria-hidden="true" />
              <span>
                Whitaker
                <small>Lead manager</small>
              </span>
            </Link>
            {open && (
              <button type="button" className="adm-menubtn" onClick={() => setOpen(false)} aria-label="Close menu">
                ✕
              </button>
            )}
          </div>
          <nav aria-label="Admin">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
                <span>{n.label}</span>
                {n.badge && <span className="adm-badge">{newCount}</span>}
              </Link>
            ))}
          </nav>
          <div className="adm-side__foot">
            <span className="who">
              Signed in as {admin?.name}
              <br />
              {admin?.email}
            </span>
            <a href="/" target="_blank" rel="noreferrer">
              View public site
            </a>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="adm-main" id="main">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}
