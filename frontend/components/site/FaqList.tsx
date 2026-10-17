'use client';

import { useId, useState } from 'react';
import type { Faq } from '@/lib/types';

type OpenMap = Record<number, boolean>;
const firstOpen = (faqs: Faq[]): OpenMap => (faqs[0] ? { [faqs[0].id]: true } : {});

/**
 * FAQ accordion (design faqItems). The first question starts open. Pending answers read
 * "Answer to be provided by …"; tags show only while review flags are on.
 */
function Accordion({ faqs, flags, business, open, toggle }: { faqs: Faq[]; flags: boolean; business: string; open: OpenMap; toggle: (id: number) => void }) {
  const uid = useId().replace(/:/g, '');
  if (!faqs.length) return <p className="body">Questions and answers will appear here soon.</p>;
  return (
    <div className="faqs">
      {faqs.map((f) => {
        const isOpen = !!open[f.id];
        const btnId = `fq-${uid}-${f.id}`;
        const panelId = `fp-${uid}-${f.id}`;
        return (
          <div key={f.id} className="faq">
            <h3>
              <button type="button" id={btnId} aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(f.id)}>
                <span>{f.q}</span>
                <span className="pm" aria-hidden="true" />
              </button>
            </h3>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={btnId} className="faq__panel">
                <p>{f.pending ? `Answer to be provided by ${business}.` : f.a}</p>
                {flags && <p className="tag tag--sm">{f.pending ? 'TO CONFIRM · Answer pending business approval' : 'DRAFT · Describes website behaviour; approve before launch'}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FaqList({ faqs, flags, business }: { faqs: Faq[]; flags: boolean; business: string }) {
  const [open, setOpen] = useState<OpenMap>(() => firstOpen(faqs));
  return <Accordion faqs={faqs} flags={flags} business={business} open={open} toggle={(id) => setOpen((o) => ({ ...o, [id]: !o[id] }))} />;
}

/** About page band: heading + "Expand all / Collapse all" on the left, the accordion on the right. */
export function FaqBand({ faqs, flags, business }: { faqs: Faq[]; flags: boolean; business: string }) {
  const [open, setOpen] = useState<OpenMap>(() => firstOpen(faqs));
  const setAll = (v: boolean) => setOpen(Object.fromEntries(faqs.map((f) => [f.id, v])));
  return (
    <div className="band__in faq-band">
      <div>
        <h2 id="faq-title" className="h-sec" style={{ fontSize: 'clamp(30px, 3.6vw, 48px)' }}>
          Frequently asked questions
        </h2>
        {faqs.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            <button type="button" className="pillbtn" onClick={() => setAll(true)}>
              Expand all
            </button>
            <button type="button" className="pillbtn" onClick={() => setAll(false)}>
              Collapse all
            </button>
          </div>
        )}
      </div>
      <div>
        <Accordion faqs={faqs} flags={flags} business={business} open={open} toggle={(id) => setOpen((o) => ({ ...o, [id]: !o[id] }))} />
      </div>
    </div>
  );
}
