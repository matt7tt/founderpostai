/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/api/downloads/seo-pro': ['./private/downloads/aisuite-seo-pro.zip'],
  },
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.founderpostai.com' }],
        destination: 'https://founderpostai.com/:path*',
        permanent: true,
      },
      {
        source: '/seo',
        destination: '/ai-suite',
        permanent: true,
      },
    ];
  },
  async headers() {
    const noIndexHeaders = [
      {
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive',
      },
    ];

    return [
      {
        source: '/api/:path*',
        headers: noIndexHeaders,
      },
      { source: '/thanks', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Cache-Control', value: 'private, no-store' }] },
      {
        source: '/downloads/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/d97a56932540c852ee2be0b99ad69fc8.txt',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      },
      ...[
        '/login',
        '/signup',
        '/dashboard',
        '/upgrade',
        '/thanks',
        '/connect',
        '/feedback-review',
        '/auth/:path*',
      ].map((source) => ({ source, headers: noIndexHeaders })),
    ];
  },
};

module.exports = nextConfig;
