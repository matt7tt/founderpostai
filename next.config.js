/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
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
      ...[
        '/login',
        '/signup',
        '/dashboard',
        '/upgrade',
        '/thanks',
        '/connect',
        '/auth/:path*',
      ].map((source) => ({ source, headers: noIndexHeaders })),
    ];
  },
};

module.exports = nextConfig;
