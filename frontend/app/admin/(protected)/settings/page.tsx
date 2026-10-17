'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminSettings } from '@/lib/types';
import { EMAIL_RE } from '@/lib/validation';
import { formatDateTime } from '@/lib/format';
import { AdminHeader, ErrorBox, Field, LoadingRows } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = Omit<AdminSettings, 'updatedAt' | 'email' | 'phone' | 'addressLine1' | 'addressLine2'> & { email: string; phone: string; addressLine1: string; addressLine2: string };

const toForm = (s: AdminSettings): Form => ({
  businessName: s.businessName,
  contactName: s.contactName,
  phone: s.phone || '',
  email: s.email || '',
  addressLine1: s.addressLine1 || '',
  addressLine2: s.addressLine2 || '',
  showAddress: s.showAddress,
  tagline: s.tagline,
  credentials: s.credentials,
  hours: s.hours,
  emergencyInfo: s.emergencyInfo,
  followUpNote: s.followUpNote,
  about: s.about,
  privacyNotice: s.privacyNotice,
  reviewNote: s.reviewNote,
  showContentFlags: s.showContentFlags,
  mobileCallBar: s.mobileCallBar,
  requestsOpen: s.requestsOpen,
});

function check(f: Form) {
  const e: Record<string, string> = {};
  if (f.businessName.trim().length < 2) e.businessName = 'Enter the business name.';
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter an email address like name@example.com.';
  const digits = f.phone.replace(/\D/g, '');
  if (f.phone.trim() && (!/^[+()\d\s.-]{7,25}$/.test(f.phone.trim()) || digits.length < 7 || digits.length > 15)) e.phone = 'Enter a phone number with 7 to 15 digits.';
  if (f.about.length > 2000) e.about = 'Use 2,000 characters or fewer.';
  if (f.privacyNotice.length > 4000) e.privacyNotice = 'Use 4,000 characters or fewer.';
  return e;
}

export default function SettingsPage() {
  const { toast } = useAdmin();
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<AdminSettings>('/admin/settings', { admin: true })
      .then((s) => {
        setSaved(s);
        setForm(toForm(s));
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setDone(false);
    if (errors[k as string])
      setErrors((p) => {
        const n = { ...p };
        delete n[k as string];
        return n;
      });
  };

  const dirty = !!(form && saved && JSON.stringify(form) !== JSON.stringify(toForm(saved)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const fe = check(form);
    setErrors(fe);
    if (Object.keys(fe).length) {
      document.getElementById(`st-${Object.keys(fe)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const s = await api<AdminSettings>('/admin/settings', {
        method: 'PATCH',
        admin: true,
        body: { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null, addressLine1: form.addressLine1.trim() || null, addressLine2: form.addressLine2.trim() || null },
      });
      setSaved(s);
      setForm(toForm(s));
      setDone(true);
      toast('Settings saved.');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!form) return <LoadingRows rows={8} />;

  const text = (k: keyof Form, label: string, opts: { max?: number; help?: string; type?: string } = {}) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={opts.help}>
      <input id={`st-${k}`} className="control" type={opts.type || 'text'} maxLength={opts.max || 160} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, help?: string, rows = 4) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={help ?? `${String(form[k]).length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`}>
      <textarea id={`st-${k}`} className="control" rows={rows} maxLength={max} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const toggle = (k: 'showContentFlags' | 'showAddress' | 'mobileCallBar' | 'requestsOpen', label: string, help: string) => (
    <div>
      <label className="adm-check">
        <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
        {label}
      </label>
      <p className="help" style={{ marginLeft: 30 }}>
        {help}
      </p>
    </div>
  );

  return (
    <>
      <AdminHeader eyebrow="SETTINGS" title="Business & settings">
        {saved && <span className="small">Last saved {formatDateTime(saved.updatedAt)}</span>}
      </AdminHeader>
      <form onSubmit={save} noValidate className="col" style={{ gap: 20, maxWidth: 900 }}>
        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-pub-h">
          <h2 id="st-pub-h" className="adm-section-h">
            Publishing
          </h2>
          {toggle('showContentFlags', 'Show pre-launch review flags', 'Shows the “PRE-LAUNCH REVIEW” banner, the dashed “TO CONFIRM” / “DRAFT” tags and FAQs whose answers are still pending. Turn off for launch once everything is confirmed.')}
          {form.showContentFlags && area('reviewNote', 'Review banner text', 600, undefined, 3)}
          {toggle('mobileCallBar', 'Mobile Call / Request Service bar', 'A fixed bar at the bottom of phone and tablet screens (hidden on the Contact page).')}
          {toggle('requestsOpen', 'Accept service requests online', 'When off, the form asks visitors to call or email and the API rejects submissions.')}
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-co-h">
          <h2 id="st-co-h" className="adm-section-h">
            Business &amp; contact
          </h2>
          <p className="small" style={{ margin: 0 }}>
            Used in the header, footer, request form and CTAs. Leave a field empty to hide it on the site.
          </p>
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {text('businessName', 'Business name *', { max: 120 })}
            {text('contactName', 'Contact person', { max: 120 })}
            {text('phone', 'Phone', { type: 'tel', max: 25 })}
            {text('email', 'Email', { type: 'email', max: 160, help: 'Also receives new-request emails unless NOTIFY_TO is set.' })}
            {text('addressLine1', 'Address line 1', { max: 160 })}
            {text('addressLine2', 'Address line 2 (city, state, ZIP)', { max: 160 })}
            {text('tagline', 'Footer tagline', { max: 200 })}
          </div>
          {toggle('showAddress', 'Publish the address', 'The design says to publish the address only after the business approves it. Off = hidden on the site (quoted in a TO CONFIRM tag while review flags are on).')}
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {area('hours', 'Business hours', 300, 'Shown on the Contact page once filled in. Empty = hidden.', 2)}
            {area('emergencyInfo', 'Emergency availability', 300, 'Shown on the Contact page once filled in. Empty = hidden.', 2)}
            {area('credentials', 'Licensing, insurance or experience (verifiable)', 600, 'Shown in “Why Whitaker Plumbing” once supplied. Empty = hidden.', 3)}
            {area('followUpNote', 'Follow-up process & timing', 400, 'Shown on the request success card once approved. Empty = no promise made.', 3)}
          </div>
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-copy-h">
          <h2 id="st-copy-h" className="adm-section-h">
            About &amp; privacy
          </h2>
          {area('about', 'About intro (blank line = new paragraph)', 2000)}
          {area('privacyNotice', 'Privacy notice (blank line = new paragraph)', 4000, undefined, 5)}
        </section>

        <div className="adm-actions" style={{ position: 'sticky', bottom: 0, padding: '14px 0', background: 'var(--a-bg)' }}>
          <button type="submit" className="abtn" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {dirty && (
            <button type="button" className="abtn abtn--line" onClick={() => saved && setForm(toForm(saved))}>
              Discard changes
            </button>
          )}
          {done && !dirty && (
            <span className="small" role="status">
              ✓ Saved —{' '}
              <a href="/" target="_blank" rel="noreferrer">
                view the site ↗
              </a>
            </span>
          )}
        </div>
      </form>
    </>
  );
}
