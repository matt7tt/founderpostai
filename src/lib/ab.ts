import { track as vaTrack } from '@vercel/analytics';

// Stripe Payment Links (see .env.example)
export const PAYMENT_LINKS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO || '#pricing',
  agency: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY || '#pricing',
};

export type AnalyticsProperties = Record<string, string | number | boolean>;

type BrowserFunnelEvent =
  | 'page_view'
  | 'core_install_click'
  | 'seo_download_click'
  | 'pro_checkout_click'
  | 'agency_checkout_click';

function browserFunnelEvent(
  event: string,
  props: AnalyticsProperties
): BrowserFunnelEvent | null {
  if (event === 'qualified_page_view') return 'page_view';
  if (event === 'core_install_click') return 'core_install_click';
  if (event === 'plugin_download' && props.file === 'aisuite-seo.zip') {
    return 'seo_download_click';
  }
  if (event === 'checkout_click' && props.plan === 'pro') return 'pro_checkout_click';
  if (event === 'checkout_click' && props.plan === 'agency') return 'agency_checkout_click';
  return null;
}

export function track(event: string, props: AnalyticsProperties = {}) {
  try {
    vaTrack(event, props);
  } catch {
    // analytics unavailable (dev/adblock) — never break UX
  }

  const funnelEvent = browserFunnelEvent(event, props);
  if (typeof window !== 'undefined' && funnelEvent) {
    const pathValue = props.source_path || props.path || window.location.pathname;
    const path = typeof pathValue === 'string' ? pathValue : window.location.pathname;
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: funnelEvent, path }),
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => {
      // First-party analytics must never interrupt navigation or application UX.
    });
  }
}
