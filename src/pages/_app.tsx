import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { Analytics } from '@vercel/analytics/react';
import TrafficAnalytics from '@/components/TrafficAnalytics';
import { useRouter } from 'next/router';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const privatePurchase = useRouter().pathname === '/thanks';
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      {!privatePurchase && <TrafficAnalytics />}
      {!privatePurchase && <Analytics />}
    </SessionProvider>
  );
}
