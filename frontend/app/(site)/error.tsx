'use client';

import Link from 'next/link';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="state" role="alert">
      <p className="badge">
        <span className="dot" aria-hidden="true" />
        Something went wrong
      </p>
      <h1>This page didn’t load.</h1>
      <p className="body">Please try again. You can still call or use the request form.</p>
      <div className="flex-wrap" style={{ gap: 12 }}>
        <button type="button" className="btn btn-blue" onClick={reset}>
          Try again
        </button>
        <Link href="/contact" className="btn btn-outline">
          Request Service
        </Link>
      </div>
    </div>
  );
}
