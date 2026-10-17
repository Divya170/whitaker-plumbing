import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="state">
      <p className="badge">
        <span className="dot" aria-hidden="true" />
        Error 404
      </p>
      <h1>This page isn’t available.</h1>
      <p className="body">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="flex-wrap" style={{ gap: 12 }}>
        <Link href="/" className="btn btn-blue">
          Back to Home
        </Link>
        <Link href="/contact" className="btn btn-outline">
          Request Service
        </Link>
      </div>
    </main>
  );
}
