'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError, downloadCsv } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import { formatShort, STATUS_LABEL, STATUS_ORDER } from '@/lib/format';
import type { LeadList } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ErrorBox } from '@/components/admin/ui';

const PER = 8; // design: 8 per page
const SKELETON = ['92%', '78%', '86%', '64%', '81%'];

export default function LeadsPage() {
  const { toast, refreshCounts } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const dq = useDebounced(q, 300);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams({ q: dq, status: status || '', service, sort, ...extra });
      for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
      return p.toString();
    },
    [dq, status, service, sort],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<LeadList>(`/admin/leads?${params({ page: String(page), limit: String(PER) })}`, { admin: true })
      .then((d) => {
        setData(d);
        if (d.page !== page) setPage(d.page);
      })
      .catch((e: ClientApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status, service, sort]);
  useEffect(() => {
    refreshCounts();
  }, [data, refreshCounts]);

  const clearFilters = () => {
    setQ('');
    setStatus('');
    setService('');
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv(`/admin/leads/export.csv?${params()}`, `whitaker-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setExporting(false);
    }
  };

  const counts = data?.counts || {};
  const items = data?.items || [];
  const total = data?.total ?? 0;
  const tabs = ['', ...STATUS_ORDER, 'spam'];
  const first = total ? (page - 1) * PER + 1 : 0;
  const last = Math.min(total, page * PER);
  const busy = loading && !data;

  return (
    <div data-screen-label="Admin leads">
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Service requests</h1>
          <p className="adm-sub">{data ? `${counts.all ?? 0} total · ${counts.new ?? 0} new` : 'Loading…'}</p>
        </div>
        <div className="tabs" role="group" aria-label="Filter by status">
          {tabs.map((t) => {
            if (t === 'spam' && !counts.spam) return null;
            return (
              <button key={t || 'all'} type="button" className="tabbtn" aria-pressed={status === t} onClick={() => setStatus(t)}>
                {t ? STATUS_LABEL[t] : 'All'}
                <span>{t ? counts[t] ?? 0 : counts.all ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="adm-filters">
        <div className="field wide">
          <label htmlFor="q">Search name, phone, email or reference</label>
          <input id="q" type="search" className="control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fs">Service</label>
          <select id="fs" className="control" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">All services</option>
            {(data?.services || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="so">Sort</label>
          <select id="so" className="control" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="abtn abtn--line" onClick={exportCsv} disabled={exporting || !total}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}

      {busy && !error && (
        <div role="status" className="adm-panel adm-pad" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="sr-only">Loading leads</span>
          {SKELETON.map((w) => (
            <div key={w} className="skel" style={{ height: 18, width: w }} />
          ))}
        </div>
      )}

      {!busy && !error && items.length === 0 && (
        <div className="empty">
          <p>{q || status || service ? 'No requests match these filters.' : 'No service requests yet.'}</p>
          {(q || status || service) && (
            <button type="button" className="abtn abtn--line" style={{ marginTop: 14 }} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {!busy && items.length > 0 && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          <div className="ltable-wrap only-wide">
            <table className="ltable">
              <caption className="sr-only">Service requests, {sort === 'newest' ? 'newest first' : 'oldest first'}</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sort === 'newest' ? 'descending' : 'ascending'}>
                    Received
                  </th>
                  <th scope="col">Customer</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Service</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--a-text-2)' }}>{formatShort(l.createdAt)}</td>
                    <td>
                      <Link href={`/admin/leads/${l.id}`}>{l.name}</Link>
                      <div className="ref">{l.publicRef}</div>
                    </td>
                    <td>
                      <div>{l.phone}</div>
                      <div className="sub">{l.email}</div>
                    </td>
                    <td>{l.serviceLabel}</td>
                    <td>{l.location}</td>
                    <td>
                      <span className={`st st--${l.status}`}>{l.statusLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="lcards only-narrow">
            {items.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="lcard">
                  <div className="lcard__top">
                    <span className="lcard__name">{l.name}</span>
                    <span className={`st st--${l.status}`}>{l.statusLabel}</span>
                  </div>
                  <div className="lcard__l">
                    {l.serviceLabel} · {l.location}
                  </div>
                  <div className="lcard__m">
                    {formatShort(l.createdAt)} · {l.phone}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <nav aria-label="Pagination" className="pager">
            <span>
              Showing {first}–{last} of {total}
            </span>
            <div>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ← Previous
              </button>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!data || page >= data.pages}>
                Next →
              </button>
            </div>
          </nav>
        </div>
      )}

      {data && data.retentionMonths > 0 && (
        <p className="help" style={{ marginTop: 16 }}>
          Completed, closed and spam requests are deleted automatically {data.retentionMonths} months after they were closed.
        </p>
      )}
    </div>
  );
}
