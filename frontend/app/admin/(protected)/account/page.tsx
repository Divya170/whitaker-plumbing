'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ClientApiError } from '@/lib/client-api';
import { AdminHeader, Field } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

export default function AccountPage() {
  const { admin } = useAdmin();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (!cur) fe.currentPassword = 'Enter your current password.';
    if (next.length < 10) fe.newPassword = 'Use at least 10 characters for the new password.';
    if (confirm !== next) fe.confirm = 'Passwords do not match.';
    setErrors(fe);
    setError('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      await api('/admin-auth/password', { method: 'PATCH', admin: true, body: { currentPassword: cur, newPassword: next } });
      setDone(true);
      setCur('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) setError(ce.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader eyebrow="ACCOUNT" title="Your account" />
      <div className="adm-panel adm-pad" style={{ maxWidth: 560 }}>
        <dl className="kv" style={{ marginBottom: 24 }}>
          <div>
            <dt>NAME</dt>
            <dd>{admin?.name}</dd>
          </div>
          <div>
            <dt>EMAIL</dt>
            <dd>{admin?.email}</dd>
          </div>
        </dl>
        {done ? (
          <div className="success" role="status" tabIndex={-1} style={{ padding: 24 }}>
            <p className="success__k">
              <b aria-hidden="true">✓</b>Password updated
            </p>
            <p className="body" style={{ marginBottom: 20 }}>
              Use the new password next time you sign in.
            </p>
            <div className="adm-actions">
              <Link href="/admin/leads" className="abtn">
                Back to requests
              </Link>
              <button type="button" className="textbtn" onClick={() => setDone(false)}>
                Change it again
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="adm-form">
            <h2 className="h-card" style={{ fontSize: 20 }}>
              Change password
            </h2>
            {error && (
              <div role="alert" className="alert-err">
                <p>{error}</p>
              </div>
            )}
            <Field id="a-cur" label="Current password" error={errors.currentPassword}>
              <input id="a-cur" type="password" autoComplete="current-password" className="control" value={cur} onChange={(e) => setCur(e.target.value)} />
            </Field>
            <Field id="a-new" label="New password" error={errors.newPassword} help="At least 10 characters.">
              <input id="a-new" type="password" autoComplete="new-password" className="control" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <Field id="a-conf" label="Confirm new password" error={errors.confirm}>
              <input id="a-conf" type="password" autoComplete="new-password" className="control" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={busy}>
                {busy ? 'Updating…' : 'Update password'}
              </button>
              <Link href="/admin/leads" className="textbtn" style={{ display: 'inline-flex', alignItems: 'center' }}>
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
