import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { Tag } from '@/components/site/Tag';
import { AreaCheck } from '@/components/site/AreaCheck';

export const metadata: Metadata = { title: 'Service Areas', description: 'Check whether your city or ZIP code is a listed Whitaker Plumbing service area.' };

export default async function ServiceAreasPage() {
  const { settings: s, areas } = await getSite();
  const flags = s.showContentFlags;
  return (
    <>
      <section className="wrap" style={{ paddingTop: 'clamp(36px,5vw,72px)', paddingBottom: 'clamp(48px,6vw,88px)' }}>
        <div className="flex-wrap" style={{ gap: '32px clamp(32px,6vw,88px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, maxWidth: 600 }}>
            <p className="badge">
              <span className="dot" aria-hidden="true" />
              Service Areas
            </p>
            <h1 className="h-page" style={{ fontSize: 'clamp(44px,6vw,86px)' }}>
              Check Our Service Areas
            </h1>
            <p className="lead" style={{ marginTop: 22 }}>
              Check your city or ZIP code before you send a request. If your location isn’t listed, contact us and we’ll confirm whether we can help.
            </p>
          </div>
          <div className="area-check-card">
            <AreaCheck label="Check your location" large phone={s.phone} telHref={s.telHref} />
          </div>
        </div>
      </section>

      <section aria-labelledby="dir-title" className="wrap" style={{ paddingBottom: 'clamp(56px,7vw,96px)' }}>
        <h2 id="dir-title" className="h-sec" style={{ fontSize: 'clamp(26px,3vw,38px)' }}>
          Listed service locations
        </h2>
        {areas.length > 0 ? (
          <ul className="area-list">
            {areas.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
          </ul>
        ) : (
          <>
            <div className="empty-card">
              <p>No service locations are listed yet. Please contact {s.businessName} to check whether your area is covered.</p>
              {s.telHref && (
                <a href={s.telHref} className="btn btn-outline">
                  Call {s.phone}
                </a>
              )}
            </div>
            <Tag show={flags} inline>
              TO CONFIRM · Approved cities / ZIP codes. The lookup checks this list only, never distance from the address.
            </Tag>
          </>
        )}
      </section>

      <section aria-labelledby="area-cta-title" className="band" style={{ paddingBottom: 'var(--band-gutter)' }}>
        <div className="band__in cta-row">
          <div>
            <h2 id="area-cta-title">Not Sure If We Cover Your Area?</h2>
            <p>Call, or send a request with your city or ZIP code and we’ll let you know.</p>
          </div>
          <div className="flex-wrap" style={{ gap: 12 }}>
            <Link href="/contact" className="btn btn-white btn--lg">
              Request Service
            </Link>
            {s.telHref && (
              <a href={s.telHref} className="btn btn-ghost-light btn--lg">
                Call {s.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
