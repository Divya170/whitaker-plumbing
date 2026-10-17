import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';
import { Tag } from '@/components/site/Tag';

export const metadata: Metadata = { title: 'Privacy notice' };

export default async function PrivacyPage() {
  const { settings: s } = await getSite();
  return (
    <div className="prose">
      <h1 className="h-page" style={{ fontSize: 'clamp(38px,5vw,64px)' }}>
        Privacy notice
      </h1>
      {paragraphs(s.privacyNotice).map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
      {s.mailHref && (
        <p>
          Questions about your information: <a href={s.mailHref}>{s.email}</a>.
        </p>
      )}
      <Tag show={s.showContentFlags}>TO CONFIRM · Full privacy policy, data retention and deletion terms, reviewed by the business before launch.</Tag>
    </div>
  );
}
