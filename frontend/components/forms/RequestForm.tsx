'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { track } from '@/lib/links';
import { preferredTime } from '@/lib/format';
import type { FormOptions, SubmitResult } from '@/lib/types';
import { API_KEY, EMPTY, FIELD_ID, FieldKey, LABELS, ORDER, RequestForm as Form, validateAll, validateField } from '@/lib/validation';

const DRAFT_KEY = 'wp-draft';
const HELP: Partial<Record<FieldKey, string>> = { phone: 'h-phone', service: 'h-service', issue: 'h-issue', location: 'h-location' };

type Fail = null | 'network' | 'server' | 'rate' | 'paused';
interface Receipt {
  id: string;
  service: string;
  location: string;
  date: string | null;
  window: string;
}

interface Props {
  options: FormOptions;
  initialService?: string;
  businessName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
  followUpNote: string;
  flags: boolean;
}

export function RequestForm({ options, initialService, businessName, phone, telHref, email, mailHref, followUpNote, flags }: Props) {
  const ctx = useMemo(() => ({ services: options.services.map((s) => s.value), today: options.today }), [options]);
  const labelOf = (v: string) => options.services.find((s) => s.value === v)?.label || '—';

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [serverErr, setServerErr] = useState(false);
  const [fail, setFail] = useState<Fail>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Receipt | null>(null);
  const [liveMsg, setLiveMsg] = useState('');
  const started = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Restore the session draft (never the honeypot), then apply ?service= from service CTAs.
  useEffect(() => {
    let f: Form = { ...EMPTY };
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (d && typeof d === 'object') f = { ...f, ...d, company: '' };
    } catch {
      /* storage unavailable */
    }
    if (initialService && ctx.services.includes(initialService)) {
      f.service = initialService;
      track('service_category_selected', { service: initialService });
    }
    setForm(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialService]);

  const saveDraft = (f: Form) => {
    try {
      const { company: _hp, ...rest } = f;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  };

  const setField = (k: keyof Form, v: string) => {
    const next = { ...form, [k]: v };
    setForm(next);
    saveDraft(next);
    setFail(null);
    if (k !== 'extra' && k !== 'company') {
      const key = k as FieldKey;
      if (errors[key] || touched[key]) {
        const m = validateField(key, v, ctx);
        setErrors((e) => {
          const n = { ...e };
          if (m) n[key] = m;
          else delete n[key];
          return n;
        });
      }
    }
    if (!started.current && k !== 'company') {
      started.current = true;
      track('form_start');
    }
  };

  const blurField = (k: FieldKey) => {
    const m = validateField(k, form[k], ctx);
    setErrors((e) => {
      const n = { ...e };
      if (m && form[k]) n[k] = m;
      else if (!m) delete n[k];
      return n;
    });
    setTouched((t) => ({ ...t, [k]: true }));
  };

  const focusField = (k: FieldKey) => {
    const el = document.getElementById(FIELD_ID[k]);
    if (!el) return;
    el.focus({ preventScroll: true });
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as unknown as Form;
    const errs = validateAll(trimmed, ctx);
    if (Object.keys(errs).length) {
      track('form_validation_failed', { fields: Object.keys(errs).join(',') });
      setErrors(errs);
      setShowSummary(true);
      setServerErr(false);
      setFail(null);
      setLiveMsg(`There are problems with ${Object.keys(errs).length} fields.`);
      setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }
    setForm(trimmed);
    setSubmitting(true);
    setShowSummary(false);
    setFail(null);
    setLiveMsg('Sending your request…');
    try {
      const res = await api<SubmitResult>('/service-requests', {
        method: 'POST',
        timeoutMs: 20000,
        body: {
          name: trimmed.name,
          phone: trimmed.phone,
          email: trimmed.email,
          service: trimmed.service,
          issue: trimmed.issue,
          location: trimmed.location,
          preferredDate: trimmed.date || null,
          preferredWindow: trimmed.window,
          extra: trimmed.extra,
          company: trimmed.company,
        },
      });
      track('service_request_submitted', { service: trimmed.service });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setSubmitted({
        id: res.id || '—',
        service: labelOf(res.service || trimmed.service),
        location: res.location || trimmed.location,
        date: res.preferredDate ?? (trimmed.date || null),
        window: res.preferredWindow || trimmed.window,
      });
      setLiveMsg('Your service request has been received.');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        successRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch (err) {
      const x = err as ClientApiError;
      if (x.status === 422 && Object.keys(x.errors).length) {
        const mapped: Partial<Record<FieldKey, string>> = {};
        for (const [k, v] of Object.entries(x.errors)) {
          const key = (API_KEY[k] || k) as FieldKey;
          if ((ORDER as string[]).includes(key)) mapped[key] = v;
        }
        setErrors(mapped);
        setShowSummary(true);
        setServerErr(true);
        setLiveMsg('The request needs a correction.');
        setTimeout(() => summaryRef.current?.focus(), 0);
      } else {
        setFail(x.status === 429 ? 'rate' : x.status === 503 && x.code === 'requests_paused' ? 'paused' : x.status === 0 ? 'network' : 'server');
        setLiveMsg('We couldn’t send your request. Your details are still in the form.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const newRequest = () => {
    saveDraft(EMPTY);
    started.current = false;
    setForm(EMPTY);
    setErrors({});
    setTouched({});
    setSubmitted(null);
    setShowSummary(false);
    setLiveMsg('');
  };

  const callLink = telHref ? (
    <a href={telHref} onClick={() => track('phone_click')}>
      call {phone}
    </a>
  ) : mailHref ? (
    <a href={mailHref}>email {email}</a>
  ) : null;

  // ---------- states ----------
  if (!options.open) {
    return (
      <div className="card-xl paused" role="status">
        <h2>Online requests are paused right now.</h2>
        <p className="body" style={{ marginTop: 12 }}>
          {businessName} isn’t taking requests through the website at the moment. Please {callLink || 'contact the business directly'} instead.
        </p>
      </div>
    );
  }

  const live = (
    <div role="status" aria-live="polite" className="sr-only">
      {liveMsg}
    </div>
  );

  if (submitted) {
    return (
      <>
        {live}
        <div ref={successRef} tabIndex={-1} className="card-xl success">
          <div className="success__icon" aria-hidden="true">
            <i />
          </div>
          <h2>Your service request has been received.</h2>
          <p>Your request has been recorded. {businessName} will follow up using the contact details you provided. This is not an appointment confirmation.</p>
          <dl className="receipt">
            <div>
              <dt>Reference</dt>
              <dd>{submitted.id}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{submitted.service}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{submitted.location}</dd>
            </div>
            <div>
              <dt>Preferred time</dt>
              <dd>{preferredTime(submitted.date, submitted.window)}</dd>
            </div>
          </dl>
          {followUpNote ? <p className="follow">{followUpNote}</p> : flags && <p className="tag">TO CONFIRM · Follow-up process and timing. No response time is promised until approved.</p>}
          <div className="success__btns">
            <Link href="/" className="btn btn-blue">
              Back to Home
            </Link>
            <button type="button" className="btn btn-outline" onClick={newRequest}>
              Submit another request
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---------- form ----------
  const errKeys = ORDER.filter((k) => errors[k]);
  const desc = (k: FieldKey) => [HELP[k], errors[k] ? `e-${k}` : null].filter(Boolean).join(' ') || undefined;
  const cls = (k: FieldKey) => {
    const valid = !errors[k] && touched[k] && form[k] && !validateField(k, form[k], ctx);
    return `control${valid ? ' is-valid' : ''}`;
  };
  const Err = ({ k }: { k: FieldKey }) =>
    errors[k] ? (
      <p id={`e-${k}`} className="field-err">
        <span aria-hidden="true">!</span>
        {errors[k]}
      </p>
    ) : null;
  const inputProps = (k: FieldKey) => ({
    id: FIELD_ID[k],
    name: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setField(k, e.target.value),
    onBlur: () => blurField(k),
    'aria-invalid': !!errors[k],
    'aria-describedby': desc(k),
    className: cls(k),
  });
  const failText: Record<Exclude<Fail, null>, string> = {
    network: 'Your details are still here. Check your connection and try again, or ',
    server: 'Our server couldn’t record it just now. Your details are still here. Try again in a moment, or ',
    rate: 'Too many requests were sent from this connection in a short time. Please wait a few minutes and try again, or ',
    paused: 'Online requests have just been paused. Your details are still here. Please ',
  };

  return (
    <>
      {live}
      <form onSubmit={submit} noValidate aria-describedby="req-note" className="card-xl rform">
        <p id="req-note" className="req-note">
          Fields marked <span aria-hidden="true" className="req">*</span> are required.
        </p>

        {showSummary && errKeys.length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="sum-title" className="err-summary">
            <h2 id="sum-title">{serverErr ? 'Please check the highlighted field' : `Please fix ${errKeys.length} ${errKeys.length === 1 ? 'problem' : 'problems'} before sending`}</h2>
            <ul>
              {errKeys.map((k) => (
                <li key={k}>
                  <button type="button" onClick={() => focusField(k)}>
                    {LABELS[k]}: {errors[k]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fail && (
          <div role="alert" className="alert-err">
            <strong>We couldn’t send your request.</strong>
            <p>
              {failText[fail as Exclude<Fail, null>]}
              {callLink || 'contact us directly'}.
            </p>
          </div>
        )}

        <fieldset className="fset">
          <legend>
            <span aria-hidden="true">1</span>Your contact details
          </legend>
          <div className="fset__grid">
            <div className="field full">
              <label htmlFor="f-name">
                Name <span aria-hidden="true" className="req">*</span>
              </label>
              <input {...inputProps('name')} type="text" autoComplete="name" maxLength={80} required />
              <Err k="name" />
            </div>
            <div className="field">
              <label htmlFor="f-phone">
                Phone <span aria-hidden="true" className="req">*</span>
              </label>
              <input {...inputProps('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required />
              <p id="h-phone" className="hint">
                The best number to reach you on.
              </p>
              <Err k="phone" />
            </div>
            <div className="field">
              <label htmlFor="f-email">
                Email <span aria-hidden="true" className="req">*</span>
              </label>
              <input {...inputProps('email')} type="email" inputMode="email" autoComplete="email" maxLength={120} required />
              <Err k="email" />
            </div>
          </div>
        </fieldset>

        <fieldset className="fset">
          <legend>
            <span aria-hidden="true">2</span>Plumbing issue
          </legend>
          <div className="fset__stack">
            <div className="field" style={{ maxWidth: 460 }}>
              <label htmlFor="f-service">
                Service type <span aria-hidden="true" className="req">*</span>
              </label>
              <select {...inputProps('service')} required>
                <option value="">Choose a service</option>
                {options.services.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p id="h-service" className="hint">
                Not sure? Pick the closest match or “{options.services.find((s) => s.value === 'other')?.label || 'Other Plumbing Issue'}.”
              </p>
              <Err k="service" />
            </div>
            <div className="field">
              <label htmlFor="f-issue">
                Describe the issue <span aria-hidden="true" className="req">*</span>
              </label>
              <p id="h-issue" className="hint">
                What you’re noticing, where it is, and when it started.
              </p>
              <textarea {...inputProps('issue')} rows={5} maxLength={1500} required />
              <div className="row-between">
                <Err k="issue" />
                <span aria-hidden="true" className="counter">
                  {form.issue.length} / 1500
                </span>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="fset">
          <legend>
            <span aria-hidden="true">3</span>Location and preferred time
          </legend>
          <div className="fset__grid">
            <div className="field">
              <label htmlFor="f-location">
                City or ZIP code <span aria-hidden="true" className="req">*</span>
              </label>
              <input {...inputProps('location')} type="text" autoComplete="postal-code" maxLength={80} required />
              <p id="h-location" className="hint">
                A general location helps us check coverage. No street address needed yet.
              </p>
              <Err k="location" />
            </div>
            <div className="field">
              <label htmlFor="f-date">
                Preferred date <span className="opt">(optional)</span>
              </label>
              <input {...inputProps('date')} type="date" min={options.today} />
              <Err k="date" />
            </div>
            <div role="radiogroup" aria-labelledby="l-window" aria-describedby={errors.window ? 'e-window' : undefined} aria-required="true" className="field full" style={{ gap: 10 }}>
              <span id="l-window" className="label">
                Preferred time of day <span aria-hidden="true" className="req">*</span>
              </span>
              <div className="radios">
                {options.windows.map((w) => {
                  const on = form.window === w.value;
                  return (
                    <label key={w.value} className={`radio${on ? ' is-on' : errors.window ? ' is-err' : ''}`}>
                      <input type="radio" id={`w-${w.value}`} name="window" value={w.value} checked={on} onChange={() => setField('window', w.value)} />
                      {w.label}
                    </label>
                  );
                })}
              </div>
              <Err k="window" />
            </div>
          </div>
        </fieldset>

        <fieldset className="fset">
          <legend>
            <span aria-hidden="true">4</span>Additional information
          </legend>
          <div className="field" style={{ clear: 'both' }}>
            <label htmlFor="f-extra">
              Anything else we should know? <span className="opt">(optional)</span>
            </label>
            <p id="h-extra" className="hint">
              For example: access instructions, pets at home, or whether you rent.
            </p>
            <textarea id="f-extra" name="extra" rows={3} maxLength={1500} value={form.extra} onChange={(e) => setField('extra', e.target.value)} aria-describedby="h-extra" className="control control--sm" />
          </div>
        </fieldset>

        <div aria-hidden="true" className="hp">
          <label htmlFor="f-company">Company (leave blank)</label>
          <input id="f-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => setField('company', e.target.value)} />
        </div>

        <div className="submit-box">
          <p>
            We use these details only to respond to your service request. Read the <Link href="/privacy">privacy notice</Link>.
          </p>
          <div className="submit-box__row">
            <button type="submit" className="btn btn-blue btn--lg" disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="spin" aria-hidden="true" />}
              {submitting ? 'Sending request…' : fail ? 'Try again' : 'Send Service Request'}
            </button>
            {telHref && (
              <a href={telHref} onClick={() => track('phone_click')}>
                Prefer to call? {phone}
              </a>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
