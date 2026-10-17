import Link from 'next/link';

/** Blue rounded square with a white droplet + "Whitaker Plumbing" wordmark (design header/footer). */
export function Logo({ href = '/', name = 'Whitaker Plumbing' }: { href?: string; name?: string }) {
  const [first, ...rest] = name.split(' ');
  return (
    <Link href={href} className="logo" aria-label={`${name}, home`}>
      <span className="logo__mark" aria-hidden="true">
        <i />
      </span>
      <span className="logo__name">
        {first}
        {rest.length > 0 && <span> {rest.join(' ')}</span>}
      </span>
    </Link>
  );
}
