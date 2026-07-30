import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import HomeStructuredData from '../components/HomeStructuredData';
import SeoHead from '../components/SeoHead';
import Editorial from '../designs/Editorial';
import Studio from '../designs/Studio';
import { track, DesignVariant } from '../lib/ab';
import { HOME_DESCRIPTION, HOME_TITLE } from '../lib/site';

interface HomeProps {
  design: DesignVariant;
  showSwitcher: boolean;
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  req,
  res,
  query,
}) => {
  // Manual override for testing: /?v=studio or /?v=editorial
  const forced =
    query.v === 'studio' ? 'studio' : query.v === 'editorial' ? 'editorial' : null;
  const cookie = req.cookies.ab_design;
  const assigned =
    cookie === 'studio' || cookie === 'editorial'
      ? cookie
      : Math.random() < 0.5
        ? 'editorial'
        : 'studio';

  if (!forced && cookie !== 'studio' && cookie !== 'editorial') {
    res.setHeader(
      'Set-Cookie',
      `ab_design=${assigned}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; Secure; SameSite=Lax`
    );
  }

  return {
    props: {
      design: forced || assigned,
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
      <SeoHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        path="/"
        preloadImage={design === 'studio' ? '/images/studio-hero.webp' : undefined}
      />
      <HomeStructuredData />

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
