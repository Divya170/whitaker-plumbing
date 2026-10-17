'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminContentItem, ContentTypeDef, FieldDef } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Values = Record<string, string>;
interface Editing {
  id?: number;
  values: Values;
  published: boolean;
}

const toForm = (def: ContentTypeDef, fields: Record<string, unknown>): Values =>
  Object.fromEntries(def.fields.map((f) => [f.key, f.kind === 'list' ? (Array.isArray(fields[f.key]) ? (fields[f.key] as string[]).join('\n') : '') : fields[f.key] == null ? (f.kind === 'select' && f.options?.length ? f.options[0].value : '') : String(fields[f.key])]));
const fromForm = (def: ContentTypeDef, v: Values): Record<string, unknown> =>
  Object.fromEntries(def.fields.map((f) => [f.key, f.kind === 'list' ? (v[f.key] || '').split('\n').map((x) => x.trim()).filter(Boolean) : v[f.key] ?? '']));

/** Mirrors backend validateContentFields for instant feedback. */
function check(def: ContentTypeDef, v: Values) {
  const e: Record<string, string> = {};
  for (const f of def.fields) {
    const s = (v[f.key] ?? '').trim();
    if (f.required && !s) e[f.key] = `${f.label} is required.`;
    else if (f.kind === 'list') {
      const list = s.split('\n').map((x) => x.trim()).filter(Boolean);
      if (f.max && list.length > f.max) e[f.key] = `${f.label}: use ${f.max} items or fewer.`;
      else if (def.type === 'service-area' && f.key === 'zips' && list.some((z) => !/^\d{5}$/.test(z))) e[f.key] = 'Enter each ZIP code as 5 digits, one per line.';
    } else if (f.max && s.length > f.max) e[f.key] = `${f.label}: use ${f.max.toLocaleString('en-US')} characters or fewer.`;
  }
  return e;
}

function ContentInner() {
  const params = useSearchParams();
  const { toast } = useAdmin();
  const [types, setTypes] = useState<ContentTypeDef[] | null>(null);
  const [counts, setCounts] = useState<Record<string, { total: number; published: number }>>({});
  const [type, setType] = useState<string>(params.get('type') || 'faq');
  const [items, setItems] = useState<AdminContentItem[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminContentItem | null>(null);

  useEffect(() => {
    api<ContentTypeDef[]>('/admin/content/types', { admin: true })
      .then(setTypes)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);

  const loadCounts = useCallback(() => {
    api<Record<string, { total: number; published: number }>>('/admin/content/counts', { admin: true })
      .then(setCounts)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setItems(null);
    setError('');
    api<AdminContentItem[]>(`/admin/content?type=${encodeURIComponent(type)}`, { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
    loadCounts();
  }, [type, loadCounts]);
  useEffect(load, [load]);

  const def = types?.find((t) => t.type === type);

  const pick = (t: string) => {
    setType(t);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('type', t);
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      /* ignore */
    }
  };

  const mapErrors = (ce: ClientApiError) => Object.fromEntries(Object.entries(ce.errors).map(([k, val]) => [k.replace(/^fields\./, ''), val]));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit || !def) return;
    const fe = check(def, edit.values);
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    const body = { fields: fromForm(def, edit.values), published: edit.published };
    try {
      if (edit.id) await api(`/admin/content/${edit.id}`, { method: 'PATCH', body, admin: true });
      else await api('/admin/content', { method: 'POST', body: { ...body, type }, admin: true });
      toast(edit.published ? 'Saved.' : 'Saved (hidden from the site).');
      setEdit(null);
      load();
    } catch (err) {
      const ce = err as ClientApiError;
      const mapped = mapErrors(ce);
      setErrors(mapped);
      if (!Object.keys(mapped).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (it: AdminContentItem) => {
    try {
      await api(`/admin/content/${it.id}`, { method: 'PATCH', body: { published: !it.published }, admin: true });
      toast(it.published ? 'Hidden from the site.' : 'Published.');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminContentItem[]>('/admin/content/reorder', { method: 'POST', body: { type, ids: next.map((x) => x.id) }, admin: true }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const renderInput = (f: FieldDef) => {
    if (!edit) return null;
    const id = `c-${f.key}`;
    const value = edit.values[f.key] ?? '';
    const onChange = (val: string) => setEdit((e) => (e ? { ...e, values: { ...e.values, [f.key]: val } } : e));
    const label = `${f.label}${f.required ? ' *' : ''}`;
    if (f.kind === 'image') return <ImageField key={f.key} id={id} label={label} value={value} onChange={onChange} error={errors[f.key]} />;
    let input: React.ReactNode;
    if (f.kind === 'list') input = <textarea id={id} className="control" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />;
    else if (f.kind === 'textarea') input = <textarea id={id} className="control" rows={4} maxLength={f.max} value={value} onChange={(e) => onChange(e.target.value)} />;
    else if (f.kind === 'select')
      input = (
        <select id={id} className="control" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(f.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    else input = <input id={id} type="text" className="control" maxLength={f.max} value={value} onChange={(e) => onChange(e.target.value)} />;
    return (
      <Field key={f.key} id={id} label={label} error={errors[f.key]} help={f.help || (f.kind === 'list' ? `One per line${f.max ? `, up to ${f.max}` : ''}.` : f.kind === 'textarea' && f.max ? `${value.length.toLocaleString('en-US')} / ${f.max.toLocaleString('en-US')}` : undefined)}>
        {input}
      </Field>
    );
  };

  const title = (it: AdminContentItem) => {
    if (!def) return '';
    const raw = String(it.fields[def.titleField] ?? '');
    const fd = def.fields.find((f) => f.key === def.titleField);
    return fd?.kind === 'select' ? fd.options?.find((o) => o.value === raw)?.label || raw : raw;
  };
  const secondary = (it: AdminContentItem) => {
    if (type === 'faq') return [String(it.fields.a || '').trim() ? '' : 'Answer pending', it.fields.home === 'yes' ? 'Shown on home' : ''].filter(Boolean).join(' · ');
    if (type === 'benefit' || type === 'step') return String(it.fields.body || '');
    if (type === 'service-area') return Array.isArray(it.fields.zips) && it.fields.zips.length ? `ZIP: ${(it.fields.zips as string[]).join(', ')}` : 'No ZIP codes yet';
    if (type === 'site-image') return String(it.fields.alt || '');
    return String(it.fields.body || it.fields.a || '');
  };

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="FAQs, copy & photos" />
      <p className="alert-info">Only items marked <strong>Published</strong> appear on the site, in the order shown. Untick Published to hide an item without deleting it.</p>
      {error && !types ? (
        <ErrorBox message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="flex-wrap" style={{ gap: 20, alignItems: 'flex-start' }}>
          <nav aria-label="Content types" className="adm-panel type-list" style={{ flex: '0 1 280px', minWidth: 230, overflow: 'hidden' }}>
            {!types ? (
              <LoadingRows rows={4} />
            ) : (
              types.map((t) => (
                <button key={t.type} type="button" aria-pressed={t.type === type} onClick={() => pick(t.type)}>
                  <span>
                    {t.label}
                    <span className="pg">{t.page}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--a-muted)' }} title="published / total">
                    {counts[t.type] ? `${counts[t.type].published}/${counts[t.type].total}` : '0'}
                  </span>
                </button>
              ))
            )}
          </nav>

          <div className="adm-panel min0" style={{ flex: '1 1 480px' }}>
            {def && (
              <div className="adm-pad" style={{ borderBottom: '1px solid var(--a-line)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="col" style={{ gap: 6, maxWidth: 560 }}>
                  <h2 className="h-card">{def.label}</h2>
                  <p className="small" style={{ margin: 0 }}>
                    {def.description} <em>Shown on: {def.page}.</em>
                  </p>
                </div>
                {(
                  <button
                    type="button"
                    className="abtn"
                    onClick={() => {
                      setErrors({});
                      setEdit({ values: toForm(def, {}), published: true });
                    }}
                  >
                    + Add {type === 'site-image' ? 'photo' : 'item'}
                  </button>
                )}
              </div>
            )}
            {error && types ? (
              <ErrorBox message={error} onRetry={load} />
            ) : !items || !def ? (
              <LoadingRows />
            ) : items.length === 0 ? (
              <EmptyBox>Nothing here yet. The site shows its default message for this section until you publish an item.</EmptyBox>
            ) : (
              items.map((it, i) => (
                <div key={it.id} className={`item-row${it.published ? '' : ' is-draft'}`}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--a-muted)', width: 24 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {type === 'site-image' &&
                    (it.fields.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(it.fields.image)} alt="" className="thumb" />
                    ) : (
                      <span className="thumb" style={{ display: 'inline-block' }} />
                    ))}
                  <div className="col min0" style={{ flex: '1 1 200px', gap: 4 }}>
                    <span style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{title(it) || '(untitled)'}</span>
                    {secondary(it) && <span className="small">{secondary(it)}</span>}
                  </div>
                  <StatusTag kind={it.published ? 'ok' : 'draft'}>{it.published ? 'PUBLISHED' : 'DRAFT'}</StatusTag>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button type="button" className="iconbtn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </button>
                    <button type="button" className="iconbtn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </button>
                    <label className="adm-check" style={{ minHeight: 36, padding: '0 6px', fontSize: 13 }}>
                      <input type="checkbox" checked={it.published} onChange={() => togglePublished(it)} style={{ width: 18, height: 18 }} />
                      Published
                    </label>
                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => {
                        setErrors({});
                        setEdit({ id: it.id, values: toForm(def, it.fields), published: it.published });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(it)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {edit && def && (
        <Modal title={`${edit.id ? 'Edit' : 'Add'} — ${def.label}`} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            {def.fields.map(renderInput)}
            <label className="adm-check">
              <input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />
              Published (visible on the site)
            </label>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : edit.id ? 'Save' : edit.published ? 'Add' : 'Add (hidden)'}
              </button>
              <button type="button" className="abtn abtn--line" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Remove item?"
          confirmLabel="Remove"
          message={`“${title(del)}” will be permanently removed. To hide it instead, untick Published.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/content/${del.id}`, { method: 'DELETE', admin: true });
              toast('Removed.');
              setDel(null);
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}

export default function ContentAdminPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <ContentInner />
    </Suspense>
  );
}
