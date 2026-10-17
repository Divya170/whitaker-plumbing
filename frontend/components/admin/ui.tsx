'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadImage, ClientApiError } from '@/lib/client-api';

export function AdminHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <div className="adm-head">
      <div className="col" style={{ gap: 8 }}>
        {eyebrow && <span className="eyebrow eyebrow--muted">{eyebrow}</span>}
        <h1 className="adm-h1">{title}</h1>
      </div>
      {children && <div className="flex-wrap" style={{ gap: 12, alignItems: 'flex-end' }}>{children}</div>}
    </div>
  );
}

export function Field({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help && !error && <p className="help">{help}</p>}
      {error && (
        <p id={`${id}-err`} className="field-err">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, small }: { title: string; onClose: () => void; children: React.ReactNode; small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Runs once per open: initial focus, Esc to close, scroll lock, focus restore
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
    (first || ref.current?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = o;
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-h" className={`modal${small ? ' modal--sm' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <h2 id="modal-h" className="h-card" style={{ fontSize: 24 }}>
            {title}
          </h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onCancel} small>
      <p style={{ margin: 0, fontSize: 15, color: "var(--a-text-2)" }}>
        {message}
      </p>
      <div className="adm-actions">
        <button
          type="button"
          className="abtn abtn--solid-danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button type="button" className="abtn abtn--line" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function StatusTag({ kind, children }: { kind?: 'new' | 'draft' | 'ok' | 'spam'; children: React.ReactNode }) {
  return <span className={`st st--${kind || 'draft'}`}>{children}</span>;
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(23,36,43,.1)', display: 'flex', gap: 16 }}>
          <div className="skel" style={{ height: 14, flex: 1.3 }} />
          <div className="skel" style={{ height: 14, flex: 1 }} />
          <div className="skel" style={{ height: 14, width: 70 }} />
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="alert-err" style={{ marginTop: 16, background: 'var(--err-bg)', color: 'var(--err-d)' }}>
      <strong>Something went wrong.</strong>
      <p>
        {message}{' '}
        {onRetry && (
          <button type="button" className="textbtn" style={{ minHeight: 0, fontSize: 14, padding: 0 }} onClick={onRetry}>
            Retry
          </button>
        )}
      </p>
    </div>
  );
}

export function EmptyBox({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 32, fontSize: 15, color: 'var(--a-muted)' }}>{children}</div>;
}

/** Image input: upload to /api/uploads or paste a URL. */
export function ImageField({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const [busy, setBusy] = useState(false);
  const [upErr, setUpErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return setUpErr('Choose an image under 8 MB.');
    setBusy(true);
    setUpErr('');
    try {
      onChange(await uploadImage(f));
    } catch (e) {
      setUpErr((e as ClientApiError).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return (
    <Field id={id} label={label} error={error || upErr} help="JPG, PNG or WebP, up to 8 MB.">
      <div className="flex-wrap" style={{ gap: 10, alignItems: 'center' }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="thumb" style={{ width: 96, height: 64 }} />
        ) : (
          <span className="thumb" style={{ width: 96, height: 64, display: 'inline-block' }} />
        )}
        <input id={id} className="control" style={{ flex: '1 1 200px' }} value={value} placeholder="/uploads/… or https://…" onChange={(e) => onChange(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" className="abtn abtn--line abtn--sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        {value && (
          <button type="button" className="iconbtn" onClick={() => onChange('')}>
            Remove
          </button>
        )}
      </div>
    </Field>
  );
}
