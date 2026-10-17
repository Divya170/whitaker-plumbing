import { getSite } from '@/lib/api';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CallBar } from '@/components/site/CallBar';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let site;
  try {
    site = await getSite();
  } catch {
    return (
      <main id="main" className="state">
        <p className="badge">
          <span className="dot" aria-hidden="true" />
          Service unavailable
        </p>
        <h1>We’ll be right back.</h1>
        <p className="body">The website can’t load its content right now. Please try again in a moment.</p>
        <a href="" className="btn btn-blue">
          Try again
        </a>
      </main>
    );
  }
  const s = site.settings;
  return (
    <>
      <a href="#main" className="skip">
        Skip to main content
      </a>
      {s.showContentFlags && s.reviewNote && (
        <div role="note" className="review">
          <div className="wrap">
            <strong>PRE-LAUNCH REVIEW</strong>
            <span>{s.reviewNote}</span>
          </div>
        </div>
      )}
      <Header name={s.businessName} phone={s.phone} telHref={s.telHref} />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer s={s} />
      <CallBar telHref={s.telHref} enabled={s.mobileCallBar} />
    </>
  );
}
