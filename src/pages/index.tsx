import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import Editorial from '../designs/Editorial';
import Studio from '../designs/Studio';
import { track, DesignVariant } from '../lib/ab';

interface HomeProps {
  design: DesignVariant;
  showSwitcher: boolean;
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ req, query }) => {
  // Manual override for testing: /?v=studio or /?v=editorial
  const forced =
    query.v === 'studio' ? 'studio' : query.v === 'editorial' ? 'editorial' : null;
  const cookie = req.cookies.ab_design;

  return {
    props: {
      design: forced || (cookie === 'studio' ? 'studio' : 'editorial'),
      // Hide the switcher from real visitors so it doesn't pollute the experiment
      showSwitcher: !!forced || process.env.NODE_ENV !== 'production',
    },
  };
};

export default function Home({ design, showSwitcher }: HomeProps) {
  useEffect(() => {
    track('landing_view', { design });
  }, [design]);

  const switchDesign = (v: DesignVariant) => {
    window.location.href = v === 'studio' ? '/?v=studio' : '/?v=editorial';
  };

  return (
    <>
      <Head>
        <title>FounderPostAI — AI plugins for WordPress that don’t suck</title>
        <meta
          name="description"
          content="Three focused AI plugins for WordPress: write faster, support visitors, and fix your SEO backlog. Fair prices, 30-day refunds, no subscriptions you forget about."
        />
      </Head>

      {design === 'studio' ? <Studio /> : <Editorial />}

      {showSwitcher && (
        <div className="fixed bottom-4 right-4 z-[200] flex overflow-hidden rounded-full border border-white/20 bg-black/80 text-xs font-medium text-white shadow-lg backdrop-blur">
          <button
            onClick={() => switchDesign('editorial')}
            className={`px-4 py-2 transition-colors ${design === 'editorial' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
          >
            Editorial
          </button>
          <button
            onClick={() => switchDesign('studio')}
            className={`px-4 py-2 transition-colors ${design === 'studio' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
          >
            Studio
          </button>
        </div>
      )}
    </>
  );
}
