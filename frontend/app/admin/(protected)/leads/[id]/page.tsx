'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { formatDay, formatShort, NOTIFY_TEXT, STATUS_LABEL, STATUS_ORDER } from '@/lib/format';
import type { Lead } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ConfirmDialog, ErrorBox } from '@/components/admin/ui';

const STATUSES = [...STATUS_ORDER, 'spam'] as const;

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, refreshCounts } = useAdmin();
  const [lead, setLead] = useState<Lead | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState<'' | 'status' | 'notes' | 'notify'>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<Lead>(`/admin/leads/${encodeURIComponent(id)}`, { admin: true })
      .then((l) => {
        setLead(l);
        setStatusDraft(l.status);
        setNotes(l.notes || '');
      })
      .catch((e: ClientApiError) => (e.status === 404 || e.status === 400 ? setMissing(true) : setError(e.message)));
  }, [id]);
  useEffect(load, [load]);

  const patch = async (body: Record<string, string>, kind: 'status' | 'notes') => {
    if (!lead) return;
    setSaving(kind);
    try {
      const l = await api<Lead>(`/admin/leads/${lead.id}`, { method: 'PATCH', body, admin: true });
      setLead(l);
      if (kind === 'status') {
        setStatusMsg(`Status updated to ${STATUS_LABEL[l.status]}.`);
        refreshCounts();
      } else toast('Notes saved.');
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setSaving('');
    }
  };

  const resend = async () => {
    if (!lead) return;
    setSaving('notify');
    try {
      setLead(await api<Lead>(`/admin/leads/${lead.id}/notify`, { method: 'POST', admin: true }));
      toast('Notification retried.');
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setSaving('');
    }
  };

  const remove = async () => {
    if (!lead) return;
    try {
      await api(`/admin/leads/${lead.id}`, { method: 'DELETE', admin: true });
      toast(`${lead.publicRef} deleted.`);
      refreshCounts();
      router.replace('/admin/leads');
    } catch (e) {
      toast((e as ClientApiError).message, true);
      setConfirmDelete(false);
    }
  };

  return (
    <div data-screen-label="Admin lead detail">
      <Link href="/admin/leads" className="backlink">
        ← All requests
      </Link>

      {missing && (
        <div className="adm-panel" style={{ marginTop: 12, padding: 32 }}>
          <h1 className="adm-h1" style={{ fontSize: 24 }}>
            Request not found
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--a-text-2)' }}>It may have been removed. Return to the list to continue.</p>
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}
      {!lead && !missing && !error && (
        <div className="adm-panel adm-pad" role="status" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="sr-only">Loading request</span>
          {['40%', '70%', '90%', '60%'].map((w) => (
            <div key={w} className="skel" style={{ height: 18, width: w }} />
          ))}
        </div>
      )}

      {lead && (
        <div className="detail">
          <div className="detail__main">
            <div className="detail__head">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>
                  {lead.publicRef} · received {formatShort(lead.createdAt)}
                </p>
                <h1>{lead.name}</h1>
              </div>
              <span className={`st st--${lead.status}`} style={{ padding: '6px 12px', fontSize: 13 }}>
                {lead.statusLabel}
              </span>
            </div>
            <dl className="dfields">
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${lead.phoneE164}`}>{lead.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                </dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{lead.serviceLabel}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{lead.location}</dd>
              </div>
              <div>
                <dt>Preferred time</dt>
                <dd>{[lead.preferredDate ? formatDay(lead.preferredDate, true) : '', lead.windowLabel].filter(Boolean).join(', ')}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatShort(lead.createdAt)}</dd>
              </div>
              <div className="span">
                <dt>Issue description</dt>
                <dd>{lead.issue}</dd>
              </div>
              <div className="span">
                <dt>Additional details</dt>
                <dd>{lead.extra || 'None provided'}</dd>
              </div>
            </dl>
          </div>

          <div className="detail__side">
            <form
              className="sidebox"
              onSubmit={(e) => {
                e.preventDefault();
                if (statusDraft !== lead.status) patch({ status: statusDraft }, 'status');
              }}
            >
              <label htmlFor="st" className="h-card">
                Update status
              </label>
              <select
                id="st"
                className="control"
                value={statusDraft}
                onChange={(e) => {
                  setStatusDraft(e.target.value);
                  setStatusMsg('');
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button type="submit" className="abtn" disabled={statusDraft === lead.status || saving === 'status'}>
                {saving === 'status' ? 'Saving…' : 'Save status'}
              </button>
              <div role="status" aria-live="polite">
                {statusMsg && <p className="okmsg">{statusMsg}</p>}
              </div>
              <p className="fine">Internal workflow status. Not shown to the customer.</p>
            </form>

            <form
              className="sidebox"
              onSubmit={(e) => {
                e.preventDefault();
                patch({ notes }, 'notes');
              }}
            >
              <label htmlFor="notes" className="h-card">
                Internal notes
              </label>
              <textarea id="notes" className="control" maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button type="submit" className="abtn abtn--line" disabled={notes === (lead.notes || '') || saving === 'notes'}>
                {saving === 'notes' ? 'Saving…' : 'Save notes'}
              </button>
            </form>

            <div className="sidebox">
              <h2 className="h-card">Notification</h2>
              <p>{NOTIFY_TEXT[lead.notifyStatus]}</p>
              {lead.notifyStatus === 'failed' && lead.notifyError && <p className="fine">Last error: {lead.notifyError}</p>}
              {(lead.notifyStatus === 'failed' || lead.notifyStatus === 'pending') && (
                <button type="button" className="abtn abtn--line abtn--sm" onClick={resend} disabled={saving === 'notify'}>
                  {saving === 'notify' ? 'Retrying…' : 'Retry now'}
                </button>
              )}
            </div>

            <div className="adm-actions">
              <a href={`tel:${lead.phoneE164}`} className="abtn">
                Call customer
              </a>
              <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your service request ${lead.publicRef}`)}`} className="abtn abtn--line">
                Email customer
              </a>
              <button type="button" className="abtn abtn--danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && lead && (
        <ConfirmDialog
          title="Delete this request?"
          message={`${lead.publicRef} from ${lead.name} will be permanently removed. This can’t be undone.`}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
