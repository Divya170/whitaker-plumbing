import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { dotFor, requestHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { Tag } from '@/components/site/Tag';

export const metadata: Metadata = { title: 'Plumbing Services', description: 'Leak repairs, drain cleaning, pipe repairs and water heater services — common signs and how to request each one.' };

export default async function ServicesPage() {
  const { settings: s, services, images } = await getSite();
  const flags = s.showContentFlags;
  const total = String(services.length).padStart(2, '0');
  const other = 'Other Plumbing Issue';

  return (
    <>
      <section className="wrap intro">
        <div className="intro__row">
          <div className="intro__copy">
            <p className="badge">
              <span className="dot" aria-hidden="true" />
              Services
            </p>
            <h1 className="h-page">Plumbing Services</h1>
            <p className="lead" style={{ maxWidth: 560, marginTop: 22 }}>
              Review the services below, then send a request describing your issue. Choosing a service from this page fills it in on the form for you.
            </p>
            <div style={{ marginTop: 28 }}>
              <Link href="/contact" className="btn btn-blue">
                Request Service <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="intro__media">
            <Photo className="intro__photo" src={images['services-hero']?.url} alt={images['services-hero']?.alt || 'Photo placeholder: plumbing tools laid out on a work mat'} label="photo · tools laid out on a work mat" />
            <div className="intro__inset">
              <Photo src={images['services-detail']?.url} alt={images['services-detail']?.alt || 'Photo placeholder: close-up of a pipe fitting'} label="detail" />
            </div>
          </div>
        </div>
        {services.length > 0 && (
          <nav aria-label="Service categories" className="cat-pills">
            {services.map((sv, i) => (
              <a key={sv.slug} href={`#${sv.slug}`}>
                <span className="dot" style={{ background: dotFor(i) }} aria-hidden="true" />
                {sv.title}
              </a>
            ))}
          </nav>
        )}
      </section>

      <div>
        {services.map((sv, i) => (
          <section key={sv.slug} id={sv.slug} aria-labelledby={`svc-${sv.slug}`} className="svc">
            <div className="svc__in">
              <div className="svc__copy">
                <span className="svc__n">
                  <span className="dot" style={{ background: dotFor(i) }} aria-hidden="true" />
                  {sv.num} of {total}
                </span>
                <h2 id={`svc-${sv.slug}`}>{sv.title}</h2>
                {sv.long && <p>{sv.long}</p>}
                {sv.signs.length > 0 && (
                  <>
                    <h3>Common signs</h3>
                    <ul className="signs">
                      {sv.signs.map((sign) => (
                        <li key={sign}>
                          <span className="dot dot--sm" aria-hidden="true" />
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="svc__ctas">
                  <Link href={requestHref(sv.slug)} className="btn btn-blue" style={{ minHeight: 52 }}>
                    Request {sv.title} <span aria-hidden="true">→</span>
                  </Link>
                  {s.telHref && (
                    <a href={s.telHref} className="svc__call">
                      or call {s.phone}
                    </a>
                  )}
                </div>
              </div>
              <Photo className="svc__img" hover src={sv.image} alt={sv.imageAlt} label={sv.imageLabel} />
            </div>
          </section>
        ))}
      </div>
      {services.length === 0 && (
        <div className="wrap">
          <p className="body">Service details are being updated. Choose “{other}” on the form and describe what’s happening.</p>
        </div>
      )}

      <section aria-labelledby="other-title" className="wrap" style={{ paddingTop: 'clamp(40px,5vw,64px)' }}>
        <div className="other-box">
          <div>
            <h2 id="other-title">Other plumbing issues</h2>
            <p>If your problem isn’t listed, choose “{other}” on the form and describe it. We’ll let you know whether it’s something we can help with.</p>
            <Tag show={flags} inline>
              TO CONFIRM · Additional services, once the business lists them
            </Tag>
          </div>
          <Link href={requestHref('other')} className="btn btn-outline">
            Request help with another issue <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="bridge-title" className="wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)', paddingBottom: 'clamp(64px,8vw,112px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 id="bridge-title" className="h-sec" style={{ fontSize: 'clamp(32px,4.4vw,58px)' }}>
            Not Sure Which Service You Need?
          </h2>
          <p className="lead" style={{ maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            You don’t need to diagnose it. Tell us what you’re seeing, hearing or smelling, and where in the house it’s happening.
          </p>
          <div style={{ marginTop: 30 }}>
            <Link href="/contact" className="btn btn-blue btn--lg">
              Describe Your Plumbing Issue <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
