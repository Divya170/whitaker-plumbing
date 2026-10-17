import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { Photo } from '@/components/site/Photo';
import { Tag } from '@/components/site/Tag';
import { FaqBand } from '@/components/site/FaqList';

export const metadata: Metadata = { title: 'About / FAQs', description: 'About Whitaker Plumbing, how service requests work, and answers to common questions.' };

export default async function AboutPage() {
  const { settings: s, steps, faqs, images } = await getSite();
  const flags = s.showContentFlags;
  return (
    <>
      <section className="wrap" style={{ paddingTop: 'clamp(36px,5vw,72px)', paddingBottom: 'clamp(36px,5vw,56px)' }}>
        <div className="about-grid">
          <div>
            <p className="badge">
              <span className="dot" aria-hidden="true" />
              About {s.businessName}
            </p>
            <h1 className="h-page" style={{ fontSize: 'clamp(44px,6vw,86px)' }}>
              Straightforward Plumbing Help.
            </h1>
          </div>
          <div>
            <p className="about-text">{s.about}</p>
            <Tag show={flags}>TO CONFIRM · Approved company story, owner photo and any credentials. Neutral description shown until supplied.</Tag>
          </div>
        </div>
      </section>

      <div className="band">
        <Photo className="wide-photo" src={images['about-wide']?.url} alt={images['about-wide']?.alt || 'Photo placeholder: a clean residential utility space with visible pipework'} label="wide photo · clean residential utility room, pipework visible" />
      </div>

      {steps.length > 0 && (
        <section aria-labelledby="how-title" className="wrap sec">
          <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px 48px' }}>
            <h2 id="how-title" className="h-sec" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
              How service requests work
            </h2>
            <p className="body" style={{ maxWidth: 440, fontSize: 16.5 }}>
              Prefer to talk it through?{' '}
              {s.telHref ? (
                <a href={s.telHref} style={{ fontWeight: 600 }}>
                  Call {s.phone}
                </a>
              ) : (
                'Call us'
              )}{' '}
              instead. Submitting a request does not confirm an appointment.
            </p>
          </div>
          <ol className="steps">
            {steps.map((st, i) => (
              <li key={st.id}>
                <span className="num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section id="faqs" aria-labelledby="faq-title" className="band" style={{ scrollMarginTop: 96 }}>
        <FaqBand faqs={faqs} flags={flags} business={s.businessName} />
      </section>

      <section aria-labelledby="about-contact-title" className="wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)', paddingBottom: 'clamp(64px,8vw,112px)' }}>
        <h2 id="about-contact-title" className="h-sec h-sec--sm">
          Get in touch
        </h2>
        <div className="ccards">
          {s.telHref && (
            <a href={s.telHref} className="ccard ccard--blue">
              <small>Phone</small>
              <strong style={{ fontSize: 24 }}>{s.phone}</strong>
            </a>
          )}
          {s.mailHref && (
            <a href={s.mailHref} className="ccard ccard--white">
              <small>Email</small>
              <strong style={{ fontSize: 20 }}>{s.email}</strong>
            </a>
          )}
          <Link href="/contact" className="ccard ccard--sand">
            <small>Online</small>
            <strong>Request Service →</strong>
          </Link>
        </div>
        {s.address ? (
          <p className="body" style={{ marginTop: 16 }}>
            {s.mapsHref ? (
              <a href={s.mapsHref} target="_blank" rel="noreferrer">
                {s.address}
              </a>
            ) : (
              s.address
            )}
          </p>
        ) : (
          <Tag show={flags && !!s.pendingAddress} inline>
            TO CONFIRM · Publish {s.pendingAddress} only after the business approves it.
          </Tag>
        )}
      </section>
    </>
  );
}
