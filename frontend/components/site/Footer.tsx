import Link from 'next/link';
import type { PublicSettings } from '@/lib/types';
import { NAV } from '@/lib/links';
import { Logo } from './Logo';
import { Tag } from './Tag';

export function Footer({ s }: { s: PublicSettings }) {
  const flags = s.showContentFlags;
  return (
    <footer className="ftr">
      <div className="ftr__in">
        <div className="ftr__grid">
          <div>
            <Logo name={s.businessName} />
            {s.tagline && <p className="ftr__tag">{s.tagline}</p>}
          </div>
          <nav aria-label="Footer">
            <p className="ftr__h">Pages</p>
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="ftr__h">Contact</p>
            {s.telHref && (
              <a href={s.telHref} className="ftr__tel">
                {s.phone}
              </a>
            )}
            {s.mailHref && (
              <a href={s.mailHref} className="ftr__mail">
                {s.email}
              </a>
            )}
            {s.address && <p className="ftr__addr">{s.address}</p>}
            <Tag show={flags && !!s.pendingAddress}>TO CONFIRM · Address shown only once approved: {s.pendingAddress}</Tag>
          </div>
          <div>
            <p className="ftr__h" style={{ marginBottom: 12 }}>
              Get help
            </p>
            <Link href="/contact" className="btn btn-blue">
              Request Service
            </Link>
            <div style={{ marginTop: 10 }}>
              <Link href="/service-areas" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, color: 'var(--ink)', fontWeight: 500, fontSize: 15.5 }}>
                Check service areas
              </Link>
            </div>
          </div>
        </div>
        <div className="ftr__bottom">
          <span>
            © {new Date().getFullYear()} {s.businessName}
          </span>
          <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/admin/login" rel="nofollow">
              Staff sign-in
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
