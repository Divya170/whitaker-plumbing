import Link from 'next/link';
import { getSite } from '@/lib/api';
import { dotFor, requestHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { Tag } from '@/components/site/Tag';
import { FaqList } from '@/components/site/FaqList';
import { AreaCheck } from '@/components/site/AreaCheck';

export default async function HomePage() {
  const { settings: s, services, faqs, benefits, assurances, images } = await getSite();
  const flags = s.showContentFlags;
  const homeFaqs = faqs.filter((f) => f.home).slice(0, 4);
  const preview = homeFaqs.length ? homeFaqs : faqs.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="hero-band">
        <div className="band__in hero">
          <div className="hero__blob" aria-hidden="true" />
          <div className="hero__row">
            <div className="hero__copy">
              <p className="badge">
                <span className="dot" aria-hidden="true" />
                Residential Plumbing Services
              </p>
              <h1 id="hero-title" className="h-hero">
                Plumbing Problems?
                <br />
                <span className="hl">Let’s Get Them Sorted.</span>
              </h1>
              <p className="hero__lead">Leaks, slow drains, damaged pipes or a water heater acting up. Explore the services we list, then call or send a request describing the problem.</p>
              <div className="hero__ctas">
                <Link href="/contact" className="btn btn-blue btn--lg">
                  Request Service <span aria-hidden="true">→</span>
                </Link>
                {s.telHref && (
                  <a href={s.telHref} className="btn btn-outline btn--lg">
                    Call {s.phone}
                  </a>
                )}
              </div>
              <p className="hero__note">The request form takes a couple of minutes: describe the issue and choose a preferred appointment time.</p>
            </div>
            <div className="hero__media">
              <Photo
                className="hero__photo"
                zoom
                src={images.hero?.url}
                alt={images.hero?.alt || 'Photo placeholder: a plumber working on pipework beneath a residential sink'}
                label="hero photo · plumber working under a residential sink, natural light (not the owner unless approved)"
              />
              {services.length > 0 && (
                <div className="hero__card">
                  <p className="hero__card-t">What’s going on?</p>
                  <p className="hero__card-s">Pick one to start a request.</p>
                  <div className="chips">
                    {services.map((sv, i) => (
                      <Link key={sv.slug} href={requestHref(sv.slug)} className="chip">
                        <span className="dot dot--sm" style={{ background: dotFor(i) }} aria-hidden="true" />
                        {sv.title}
                      </Link>
                    ))}
                    <Link href={requestHref('other')} className="chip chip--dashed">
                      Something else
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {assurances.length > 0 && (
        <section aria-label="How to get help" className="wrap">
          <ul className="assure">
            {assurances.map((a) => (
              <li key={a}>
                <span className="tick" aria-hidden="true">
                  <i />
                </span>
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Services bento */}
      <section aria-labelledby="svc-title" className="wrap sec">
        <div className="sec-head">
          <div>
            <h2 id="svc-title" className="h-sec">
              What can we help with?
            </h2>
            <p className="lead">
              {services.length === 4 ? 'Four services cover' : 'These services cover'} the most common household plumbing problems. Not sure which fits? Describe it in your own words.
            </p>
          </div>
          <Link href="/services" className="tlink">
            Explore Services <span aria-hidden="true">→</span>
          </Link>
        </div>
        {services.length ? (
          <div className="bento">
            {services.map((sv, i) => {
              const pos = i % 4;
              const withImg = pos === 0 || pos === 3;
              const tone = pos === 1 ? ' tile--sand' : pos === 2 ? ' tile--blue' : '';
              return (
                <Link key={sv.slug} href={`/services#${sv.slug}`} className={`tile${withImg ? ' tile--img' : ''}${tone}`}>
                  {withImg && <Photo className="tile__img" src={sv.image} alt={sv.imageAlt} label={sv.imageLabel} />}
                  <span className="tile__body">
                    <span className="tile__num">
                      <span className="dot dot--sm" style={{ background: dotFor(i) }} aria-hidden="true" />
                      {sv.num}
                    </span>
                    <span className="tile__t">{sv.title}</span>
                    <span className="tile__s">{sv.short}</span>
                    <span className="tile__more">
                      Learn More<span className="sr-only"> about {sv.title}</span> <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="body">Service details are being updated. Call or send a request describing your issue.</p>
        )}
      </section>

      {/* Why */}
      <section aria-labelledby="why-title" className="wrap" style={{ paddingTop: 'clamp(40px,5vw,72px)', paddingBottom: 'clamp(64px,8vw,112px)' }}>
        <div className="why">
          <div className="why__media">
            <Photo className="why__photo" zoom src={images.why?.url} alt={images.why?.alt || 'Photo placeholder: a plumber inspecting a water heater in a residential utility room'} label="photo · water heater inspection, utility room" />
            <div className="why__blob" aria-hidden="true" />
          </div>
          <div className="why__copy">
            <p className="badge">
              <span className="dot" aria-hidden="true" />
              Why {s.businessName}
            </p>
            <h2 id="why-title" className="h-sec">
              Clear Communication. Practical Plumbing Help.
            </h2>
            {benefits.length > 0 && (
              <ol className="numlist">
                {benefits.map((b, i) => (
                  <li key={b.id}>
                    <span className="num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3>{b.title}</h3>
                      <p>{b.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {s.credentials ? (
              <p className="cred">{s.credentials}</p>
            ) : (
              <Tag show={flags}>TO CONFIRM · Licensing, insurance or experience can appear here only once the business provides verifiable details.</Tag>
            )}
          </div>
        </div>
      </section>

      {/* Service area check */}
      <section aria-labelledby="area-title" className="band">
        <div className="band__in area-band">
          <div className="area-band__ring" aria-hidden="true" />
          <div className="area-band__copy">
            <h2 id="area-title" className="h-sec" style={{ fontSize: 'clamp(30px,3.6vw,48px)' }}>
              Check Our Service Areas
            </h2>
            <p className="lead">Before you send a request, check whether your city or ZIP code is listed. If it isn’t, call and we can confirm.</p>
            <div style={{ marginTop: 20 }}>
              <Link href="/service-areas" className="tlink">
                View service areas <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="area-band__card">
            <AreaCheck label="Check your city or ZIP code" phone={s.phone} telHref={s.telHref} />
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      {preview.length > 0 && (
        <section aria-labelledby="faq-prev-title" className="wrap" style={{ paddingTop: 'clamp(64px,8vw,112px)', paddingBottom: 'clamp(64px,8vw,112px)' }}>
          <div className="faq-split">
            <div>
              <h2 id="faq-prev-title" className="h-sec" style={{ fontSize: 'clamp(30px,3.4vw,44px)' }}>
                Questions before you call?
              </h2>
              <p className="lead">Quick answers to what people usually ask first.</p>
              <div style={{ marginTop: 18 }}>
                <Link href="/about#faqs" className="tlink">
                  View All FAQs <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div>
              <FaqList faqs={preview} flags={flags} business={s.businessName} />
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section aria-labelledby="close-title" className="band" style={{ paddingBottom: 'var(--band-gutter)' }}>
        <div className="band__in cta-band">
          <div className="cta-band__glow" aria-hidden="true" />
          <h2 id="close-title" className="h-big">
            Tell Us What’s Going On.
          </h2>
          <p>Describe your plumbing issue and share a convenient time for us to contact you.</p>
          <div className="cta-band__btns">
            <Link href="/contact" className="btn btn-white btn--lg">
              Request Service <span aria-hidden="true">→</span>
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
