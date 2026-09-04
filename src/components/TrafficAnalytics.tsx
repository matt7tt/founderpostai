import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { track } from '../lib/ab';

function safePath(value: string): string {
  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return value.split('?')[0].split('#')[0];
  }
}

export default function TrafficAnalytics() {
  const router = useRouter();
  const { asPath, isReady } = router;

  useEffect(() => {
    if (!isReady) return;

    track('qualified_page_view', {
      path: safePath(asPath),
      referrer_host: document.referrer
        ? new URL(document.referrer).hostname
        : 'direct',
    });
  }, [asPath, isReady]);

  useEffect(() => {
    const recordClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!(target instanceof HTMLAnchorElement)) return;

      const href = target.href;
      const url = new URL(href, window.location.href);
      const sourcePath = window.location.pathname;

      if (
        url.hostname === 'wordpress.org' &&
        url.pathname.replace(/\/+$/, '') === '/plugins/founderpostai-ai-suite-core'
      ) {
        track('core_install_click', { source_path: sourcePath });
        return;
      }

      if (url.pathname.startsWith('/downloads/')) {
        track('plugin_download', {
          file: url.pathname.split('/').pop() || 'unknown',
          source_path: sourcePath,
        });
        return;
      }

      if (href.startsWith('mailto:')) {
        track('support_click', { source_path: sourcePath });
        return;
      }

      if (url.hash === '#pricing') {
        track('pricing_click', {
          source_path: sourcePath,
          destination_path: url.pathname,
        });
        return;
      }

      if (url.origin !== window.location.origin) {
        track('outbound_click', {
          destination_host: url.hostname,
          source_path: sourcePath,
        });
      }
    };

    document.addEventListener('click', recordClick);
    return () => document.removeEventListener('click', recordClick);
  }, []);

  return null;
}
