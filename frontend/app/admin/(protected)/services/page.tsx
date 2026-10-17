'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminService } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = { title: string; slug: string; short: string; long: string; signs: string; image: string; imageAlt: string; imageLabel: string; published: boolean };
const EMPTY: Form = { title: '', slug: '', short: '', long: '', signs: '', image: '', imageAlt: '', imageLabel: '', published: false };

const toForm = (s: AdminService): Form => ({
  title: s.title, slug: s.slug, short: s.short, long: s.long, signs: (s.signs || []).join('\n'),
  image: s.image || '', imageAlt: s.imageAlt, imageLabel: s.imageLabel, published: s.published,
});

/** Mirrors backend validateService for instant feedback. */
function check(f: Form, isNew: boolean) {
  const e: Record<string, string> = {};
  const len = (k: keyof Form, max: number) => {
    if (String(f[k]).trim().length > max) e[k] = `Use ${max.toLocaleString('en-US')} characters or fewer.`;
  };
  if (f.title.trim().length < 2) e.title = 'Enter a service title.';
  len('title', 80);
  if (isNew && f.slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
    else if (f.slug === 'other') e.slug = '“other” is reserved for the form’s “Other Plumbing Issue” option.';
  }
  len('short', 300);
  len('long', 1200);
  const items = f.signs.split('\n').map((x) => x.trim()).filter(Boolean);
  if (items.length > 6) e.signs = 'Use 6 signs or fewer.';
  if (f.published && f.short.trim().length < 10) e.short = 'Add a short summary (at least 10 characters) before publishing.';
  return e;
}

export default function ServicesAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminService[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ id?: number; slug?: string; form: Form } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminService | null>(null);

  const load = useCallback(() => {
    setError('');
    api<AdminService[]>('/admin/services', { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = check(edit.form, !edit.id);
    setErrors(fe);
    if (Object.keys(fe).length) {
      document.getElementById(`s-${Object.keys(fe)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    const f = edit.form;
    const body = { ...f, signs: f.signs.split('\n').map((x) => x.trim()).filter(Boolean), image: f.image || null };
    try {
      if (edit.id) await api(`/admin/services/${edit.id}`, { method: 'PATCH', admin: true, body });
      else await api('/admin/services', { method: 'POST', admin: true, body });
      toast(edit.id ? 'Service saved.' : 'Service added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (s: AdminService) => {
    try {
      await api(`/admin/services/${s.id}`, { method: 'PATCH', admin: true, body: { published: !s.published } });
      toast(s.published ? `${s.title} hidden from the site.` : `${s.title} published.`);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      toast(Object.values(ce.errors)[0] || ce.message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminService[]>('/admin/services/reorder', { method: 'POST', admin: true, body: { ids: next.map((x) => x.id) } }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const f = edit?.form;
  const text = (k: keyof Form, label: string, max: number, help?: string) => (
    <Field id={`s-${k}`} label={label} error={errors[k]} help={help}>
      <input id={`s-${k}`} className="control" maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, rows = 3, help?: string) => (
    <Field id={`s-${k}`} label={label} error={errors[k]} help={help ?? `${String(f?.[k] ?? '').length} / ${max}`}>
      <textarea id={`s-${k}`} className="control" rows={rows} maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Services">
        <button
          type="button"
          className="abtn"
          onClick={() => {
            setErrors({});
            setEdit({ form: { ...EMPTY } });
          }}
        >
          + Add service
        </button>
      </AdminHeader>
      <p className="alert-info">Published services appear in the home bento and hero “What’s going on?” card, on the Services page and in the request form’s “Service type” list (followed by “Other Plumbing Issue”). Order here is the order on the site; the design is laid out for four.</p>
      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No services yet. The site shows “Service details are being updated” and the form offers only “Other Plumbing Issue”.</EmptyBox>
        ) : (
          items.map((s, i) => (
            <div key={s.id} className={`item-row${s.published ? '' : ' is-draft'}`}>
              <span className="mono" style={{ fontSize: 12, width: 24, color: 'var(--a-muted)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="thumb" />
              ) : (
                <span className="thumb" style={{ display: 'inline-block' }} />
              )}
              <div className="col min0" style={{ flex: '1 1 240px', gap: 2 }}>
                <strong>{s.title}</strong>
                <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.short || 'No summary yet.'}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--a-muted)' }}>
                  form value: {s.slug}
                </span>
              </div>
              <StatusTag kind={s.published ? 'ok' : 'draft'}>{s.published ? 'Published' : 'Hidden'}</StatusTag>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" aria-label={`Move ${s.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="iconbtn" aria-label={`Move ${s.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="iconbtn" onClick={() => togglePublished(s)}>
                  {s.published ? 'Hide' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit({ id: s.id, slug: s.slug, form: toForm(s) });
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(s)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && f && (
        <Modal title={edit.id ? `Edit — ${f.title || 'service'}` : 'Add service'} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            {text('title', 'Title *', 80)}
            {!edit.id && (
              <Field id="s-slug" label="Form value (optional)" error={errors.slug} help="Used in links like /contact?service=leak and stored on each request. Made from the title when empty. Can’t be changed later.">
                <input id="s-slug" className="control" maxLength={40} value={f.slug} autoCapitalize="none" spellCheck={false} onChange={(e) => setF('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
              </Field>
            )}
            {area('short', 'Home tile summary', 300, 2)}
            {area('long', 'Services-page paragraph', 1200, 4)}
            {area('signs', '“Common signs” chips', 800, 4, 'One per line, up to 6.')}
            <ImageField id="s-image" label="Photo (home tile + services page)" value={f.image} onChange={(v) => setF('image', v)} error={errors.image} />
            <div className="grid-fit" style={{ ['--min' as string]: '220px', ['--gap' as string]: '16px' }}>
              {text('imageAlt', 'Photo alt text', 200)}
              {text('imageLabel', 'Placeholder label', 160, 'Shown until a photo is added.')}
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={f.published} onChange={(e) => setF('published', e.target.checked)} />
              Published (visible on the site and in the request form)
            </label>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : 'Save service'}
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
          title="Delete service?"
          message={`“${del.title}” will be removed from the site and the request form. Existing requests keep their service value. To hide it for now, use Hide instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/services/${del.id}`, { method: 'DELETE', admin: true });
              toast('Service deleted.');
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
