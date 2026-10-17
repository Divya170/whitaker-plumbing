import type { Metadata } from 'next';
import { getFormOptions, getSite } from '@/lib/api';
import { RequestForm } from '@/components/forms/RequestForm';
import { Tag } from '@/components/site/Tag';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Request Plumbing Service', description: 'Tell us about the plumbing issue, how to reach you, and a time that works for you.' };

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const [{ settings: s, tips }, options] = await Promise.all([getSite(), getFormOptions()]);
  const flags = s.showContentFlags;
  return (
    <div className="wrap" style={{ paddingTop: 'clamp(32px,5vw,64px)', paddingBottom: 'clamp(64px,8vw,112px)' }}>
      <p className="badge">
        <span className="dot" aria-hidden="true" />
        Contact
      </p>
      <h1 className="h-page" style={{ maxWidth: 860, fontSize: 'clamp(42px,5.8vw,80px)' }}>
        Request Plumbing Service
      </h1>
      <p className="lead" style={{ marginTop: 20, maxWidth: 620, fontSize: 18.5 }}>
        Tell us a little about the issue, how to reach you, and a time that works for you.
      </p>
      <p className="small" style={{ margin: '8px 0 0', maxWidth: 620, fontSize: 15.5 }}>
        This form sends a service request. It does not book or confirm an appointment.
      </p>

      <div className="req-layout">
        <div className="req-main">
          <RequestForm
            options={options}
            initialService={one(searchParams.service)}
            businessName={s.businessName}
            phone={s.phone}
            telHref={s.telHref}
            email={s.email}
            mailHref={s.mailHref}
            followUpNote={s.followUpNote}
            flags={flags}
          />
        </div>

        <aside aria-label="Contact details" className="req-aside">
          <div className="aside-blue">
            {s.telHref && (
              <>
                <small>Call directly</small>
                <a href={s.telHref} className="big">
                  {s.phone}
                </a>
              </>
            )}
            {s.mailHref && (
              <div className={s.telHref ? 'gap' : ''}>
                <small>Email</small>
                <a href={s.mailHref} className="mail">
                  {s.email}
                </a>
              </div>
            )}
            {s.hours && (
              <div className="gap">
                <small>Business hours</small>
                <p className="info">{s.hours}</p>
              </div>
            )}
            {s.emergencyInfo && (
              <div className="gap">
                <small>Emergencies</small>
                <p className="info">{s.emergencyInfo}</p>
              </div>
            )}
            {(!s.hours || !s.emergencyInfo) && (
              <Tag show={flags} dark>
                TO CONFIRM · {!s.hours && !s.emergencyInfo ? 'Business hours and emergency availability' : !s.hours ? 'Business hours' : 'Emergency availability'}
              </Tag>
            )}
          </div>
          {tips.length > 0 && (
            <div className="aside-sand">
              <h2>Helpful details to include</h2>
              <ul className="tips">
                {tips.map((t) => (
                  <li key={t}>
                    <span className="dot" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="aside-white">
            <h2>After you submit</h2>
            <p>You’ll see a confirmation once your request is recorded. {s.businessName} will then contact you to discuss the issue and timing.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
