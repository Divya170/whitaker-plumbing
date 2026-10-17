'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ClientApiError, hasSessionHint } from '@/lib/client-api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const dest = next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin/leads';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in (valid session cookie) → straight to the leads (design: login redirects when authed)
  useEffect(() => {
    if (!hasSessionHint()) return;
    api('/admin-auth/me')
      .then(() => router.replace(dest))
      .catch(() => {});
  }, [router, dest]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      document.getElementById(email.trim() ? 'a-pass' : 'a-email')?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/admin-auth/login', { method: 'POST', body: { email: email.trim(), password } });
      setPassword('');
      router.replace(dest);
    } catch (err) {
      const ce = err as ClientApiError;
      setError(ce.status === 400 ? Object.values(ce.errors)[0] || 'Enter a valid email address.' : ce.message);
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="login-card">
        <h1>Sign in to manage leads</h1>
        {error && (
          <p role="alert" className="alert-err" style={{ margin: 0, color: 'var(--err-d)', background: 'var(--err-bg)' }}>
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="a-email" className="adm-label" style={{ fontSize: 15 }}>
            Email
          </label>
          <input id="a-email" type="email" autoComplete="username" className="control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="a-pass" className="adm-label" style={{ fontSize: 15 }}>
            Password
          </label>
          <input id="a-pass" type="password" autoComplete="current-password" className="control" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="abtn" disabled={busy} aria-busy={busy}>
          {busy && <span className="spin" aria-hidden="true" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="help" style={{ fontSize: 12.5 }}>
          Sessions are held in a secure, HttpOnly cookie; every /api/admin endpoint checks the session. Forgotten password? Ask the site owner to reset it (see README).
        </p>
      </form>
      <Link href="/" style={{ display: 'inline-flex', marginTop: 18, minHeight: 44, alignItems: 'center', fontSize: 15, color: 'var(--a-link)' }}>
        ← Back to public website
      </Link>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="login-wrap adm-root">
      <div className="login-box">
        <div className="login-brand">
          <span className="amark amark--dark" aria-hidden="true" />
          <span style={{ color: 'var(--a-teal)', fontWeight: 800 }}>
            Whitaker Plumbing <span>· Admin</span>
          </span>
        </div>
        <Suspense fallback={<div className="login-card" aria-busy="true" style={{ minHeight: 360 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
