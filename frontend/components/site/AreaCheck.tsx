'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { track } from '@/lib/links';
import type { AreaResult } from '@/lib/types';

/**
 * "Check your city or ZIP code" (design checkArea). The match runs on the server against the
 * approved service-area list only — never distance from the business address.
 */
export function AreaCheck({ label, large, phone, telHref }: { label: string; large?: boolean; phone: string | null; telHref: string | null }) {
  const uid = useId().replace(/:/g, '');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<AreaResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    if (!s) return setRes({ kind: 'error', text: 'Enter a city, town or ZIP code to check.' });
    setBusy(true);
    try {
      setRes(await api<AreaResult>(`/service-areas/check?q=${encodeURIComponent(s)}`));
      track('service_area_checked');
    } catch (err) {
      setRes({ kind: 'info', text: (err as ClientApiError).status === 429 ? 'Too many checks in a short time. Please wait a minute, or call us.' : 'We couldn’t check that right now. Contact us to confirm your area.' });
    } finally {
      setBusy(false);
    }
  };

  const help = `area-help-${uid}`;
  const result = `area-result-${uid}`;
  return (
    <form onSubmit={submit} noValidate className={`acheck${large ? ' acheck--lg' : ''}`}>
      <label htmlFor={`area-q-${uid}`}>{label}</label>
      <p id={help} className="acheck__help">
        Enter a city, town or 5-digit ZIP code.
      </p>
      <div className={`acheck__row${res?.kind === 'error' ? ' is-err' : ''}`}>
        <input
          id={`area-q-${uid}`}
          type="text"
          autoComplete="postal-code"
          maxLength={60}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setRes(null);
          }}
          aria-describedby={`${help} ${result}`}
          aria-invalid={res?.kind === 'error'}
        />
        <button type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Checking…' : 'Check'}
        </button>
      </div>
      <div id={result} role="status" aria-live="polite">
        {res && (
          <div className={`aresult aresult--${res.kind}`}>
            <p>{res.text}</p>
            {res.kind !== 'error' && (
              <p>
                {telHref && (
                  <>
                    <a href={telHref} onClick={() => track('phone_click')}>
                      Call {phone}
                    </a>{' '}
                    or{' '}
                  </>
                )}
                <Link href="/contact">send a request</Link> and mention your location.
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
