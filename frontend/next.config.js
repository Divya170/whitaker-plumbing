/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Browser calls stay same-origin: /api/* and /uploads/* are proxied to NestJS
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
};
