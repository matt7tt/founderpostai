import type { GetServerSideProps } from 'next';
import SeoHead from '@/components/SeoHead';
import { listFeedback } from '@/lib/feedback';
import {
  feedbackAdminConfigured,
  isFeedbackAdminRequest,
} from '@/lib/feedback-admin';
import { FEEDBACK_STATUSES, type FeedbackRecord } from '@/lib/feedback-shared';
import {
  getFunnelReport,
  type FunnelEvent,
  type FunnelReport,
} from '@/lib/funnel';

interface FeedbackReviewProps {
  authenticated: boolean;
  configured: boolean;
  feedback: FeedbackRecord[];
  funnel: FunnelReport | null;
  funnelError: string;
  loadError: string;
  loginError: boolean;
}

const productNames: Record<string, string> = {
  core: 'AI Suite Core',
  seo: 'AI Suite SEO',
  'seo-pro': 'AI Suite SEO Pro',
};

const funnelLabels: Array<{ event: FunnelEvent; label: string }> = [
  { event: 'page_view', label: 'Website page views' },
  { event: 'core_install_click', label: 'Core install clicks' },
  { event: 'seo_download_click', label: 'SEO downloads' },
  { event: 'connection_code_created', label: 'Codes generated' },
  { event: 'site_connected', label: 'Sites connected' },
  { event: 'first_job_completed', label: 'First jobs completed' },
  { event: 'pro_checkout_click', label: 'Pro checkout clicks' },
  { event: 'agency_checkout_click', label: 'Agency checkout clicks' },
  { event: 'purchase_completed', label: 'Purchases confirmed' },
];

export const getServerSideProps: GetServerSideProps<FeedbackReviewProps> = async ({ req, res, query }) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const configured = feedbackAdminConfigured();
  const authenticated = configured && isFeedbackAdminRequest(req);
  let feedback: FeedbackRecord[] = [];
  let funnel: FunnelReport | null = null;
  let funnelError = '';
  let loadError = '';

  if (authenticated) {
    const [feedbackResult, funnelResult] = await Promise.allSettled([
      listFeedback(),
      getFunnelReport(),
    ]);
    if (feedbackResult.status === 'fulfilled') {
      feedback = feedbackResult.value;
    } else {
      console.error('Feedback inbox failed to load:', feedbackResult.reason);
      loadError = 'The feedback store could not be reached. Try refreshing in a moment.';
    }
    if (funnelResult.status === 'fulfilled') {
      funnel = funnelResult.value;
    } else {
      console.error('Growth funnel failed to load:', funnelResult.reason);
      funnelError = 'The growth metrics could not be reached. Try refreshing in a moment.';
    }
  }

  return {
    props: {
      authenticated,
      configured,
      feedback,
      funnel,
      funnelError,
      loadError,
      loginError: query.error === '1',
    },
  };
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value));
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

export default function FeedbackReview({
  authenticated,
  configured,
  feedback,
  funnel,
  funnelError,
  loadError,
  loginError,
}: FeedbackReviewProps) {
  const newCount = feedback.filter((item) => item.status === 'new').length;

  return (
    <>
      <SeoHead
        title="Growth & Plugin Feedback | FounderPostAI"
        description="Private FounderPostAI product funnel and plugin feedback inbox."
        path="/feedback-review"
        noIndex
      />
      <main className="feedback-shell">
        {!authenticated ? (
          <section className="login-card">
            <p className="eyebrow">FounderPostAI · Private</p>
            <h1>Growth &amp; feedback</h1>
            {!configured ? (
              <p className="error">
                Add FEEDBACK_ADMIN_PASSWORD and NEXTAUTH_SECRET (or
                FEEDBACK_ADMIN_SESSION_SECRET or GATEWAY_KMS_KEY) to the deployment environment
                first.
              </p>
            ) : (
              <>
                {loginError && <p className="error">That password was not accepted.</p>}
                <form method="post" action="/api/feedback-admin/login">
                  <label htmlFor="password">Admin password</label>
                  <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
                  <button type="submit">Open inbox</button>
                </form>
              </>
            )}
          </section>
        ) : (
          <>
            <header className="inbox-header">
              <div>
                <p className="eyebrow">FounderPostAI · Private</p>
                <h1>Growth &amp; feedback</h1>
                <p>Private product funnel and plugin feedback inbox</p>
              </div>
              <form method="post" action="/api/feedback-admin/logout">
                <button type="submit" className="secondary">Sign out</button>
              </form>
            </header>

            <section className="growth-section" aria-labelledby="growth-heading">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Last 30 days</p>
                  <h2 id="growth-heading">Product funnel</h2>
                </div>
                <p>Anonymous daily counters · {funnel?.retentionDays || 180}-day retention</p>
              </div>

              {funnelError && <p className="error">{funnelError}</p>}
              {funnel && (
                <>
                  <div className="metric-grid">
                    {funnelLabels.map(({ event, label }) => (
                      <article className="metric-card" key={event}>
                        <p>{label}</p>
                        <strong>{funnel.metrics[event].last30.toLocaleString()}</strong>
                        <span>
                          {funnel.metrics[event].last7.toLocaleString()} last 7d ·{' '}
                          {funnel.metrics[event].previous7.toLocaleString()} prior 7d
                        </span>
                      </article>
                    ))}
                  </div>

                  {funnel.topPaths.length > 0 && (
                    <div className="daily-wrap">
                      <table>
                        <caption>Top page paths and actions over the last 30 days</caption>
                        <thead>
                          <tr>
                            <th>Page path</th>
                            <th>Views</th>
                            <th>Core clicks</th>
                            <th>SEO downloads</th>
                            <th>Pro checkout</th>
                            <th>Agency checkout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {funnel.topPaths.map((item) => (
                            <tr key={item.path}>
                              <th scope="row"><code>{item.path}</code></th>
                              <td>{item.counts.page_view}</td>
                              <td>{item.counts.core_install_click}</td>
                              <td>{item.counts.seo_download_click}</td>
                              <td>{item.counts.pro_checkout_click}</td>
                              <td>{item.counts.agency_checkout_click}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="daily-wrap">
                    <table>
                      <caption>Daily funnel counts for the most recent 14 days</caption>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Views</th>
                          <th>Plugin clicks</th>
                          <th>Codes</th>
                          <th>Connected</th>
                          <th>First jobs</th>
                          <th>Checkout</th>
                          <th>Purchases</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...funnel.daily].reverse().map((day) => (
                          <tr key={day.date}>
                            <th scope="row">{formatDay(day.date)}</th>
                            <td>{day.counts.page_view}</td>
                            <td>{day.counts.core_install_click + day.counts.seo_download_click}</td>
                            <td>{day.counts.connection_code_created}</td>
                            <td>{day.counts.site_connected}</td>
                            <td>{day.counts.first_job_completed}</td>
                            <td>{day.counts.pro_checkout_click + day.counts.agency_checkout_click}</td>
                            <td>{day.counts.purchase_completed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <div className="feedback-heading">
              <div>
                <p className="eyebrow">Plugin users</p>
                <h2>Feedback inbox</h2>
              </div>
              <p>{newCount} new · {feedback.length} total shown</p>
            </div>

            {loadError && <p className="error">{loadError}</p>}
            {!loadError && feedback.length === 0 && (
              <section className="empty">No plugin feedback has arrived yet.</section>
            )}

            <div className="feedback-list">
              {feedback.map((item) => (
                <article className={`feedback-card feedback-card--${item.status}`} id={item.id} key={item.id}>
                  <header>
                    <div className="badges">
                      <span className="badge">{item.category}</span>
                      <span className="badge">{productNames[item.product] || item.product}</span>
                      <span className={`status status--${item.status}`}>{item.status}</span>
                    </div>
                    <time dateTime={item.created_at}>{formatDate(item.created_at)} PT</time>
                  </header>

                  <p className="message">{item.message}</p>

                  <dl>
                    <div><dt>Site</dt><dd><a href={item.site_url} target="_blank" rel="noreferrer">{item.site_url}</a></dd></div>
                    <div><dt>Reply</dt><dd>{item.contact_email ? <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a> : 'Not provided'}</dd></div>
                    <div><dt>Versions</dt><dd>Plugin {item.plugin_version || '—'} · Core {item.core_version || '—'} · WP {item.wp_version || '—'} · PHP {item.php_version || '—'}</dd></div>
                    <div><dt>ID</dt><dd><code>{item.id}</code></dd></div>
                  </dl>

                  <form className="review-form" method="post" action="/api/feedback-admin/update">
                    <input type="hidden" name="id" value={item.id} />
                    <label>
                      Status
                      <select name="status" defaultValue={item.status}>
                        {FEEDBACK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="notes">
                      Private notes
                      <textarea name="admin_notes" rows={2} maxLength={3000} defaultValue={item.admin_notes} />
                    </label>
                    <button type="submit">Save</button>
                  </form>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
      <style jsx>{`
        :global(body) { margin: 0; background: #f7f4ee; color: #1b1712; }
        .feedback-shell { max-width: 1040px; margin: 0 auto; padding: 56px 24px 96px; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        h1 { margin: 4px 0 8px; font-family: Charter, Cambria, Georgia, serif; font-size: clamp(36px, 6vw, 58px); letter-spacing: -0.04em; }
        h2 { margin: 4px 0 0; font-family: Charter, Cambria, Georgia, serif; font-size: 30px; letter-spacing: -0.025em; }
        .eyebrow { margin: 0; font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .09em; text-transform: uppercase; color: #5c554c; }
        .login-card, .feedback-card, .empty { background: #fffefa; border: 1px solid #1b1712; box-shadow: 5px 5px 0 #1b1712; }
        .login-card { max-width: 480px; margin: 10vh auto 0; padding: 32px; }
        label { display: grid; gap: 7px; font-size: 13px; font-weight: 700; }
        input, select, textarea { box-sizing: border-box; width: 100%; border: 1px solid #8d867c; border-radius: 0; background: white; padding: 10px 11px; color: inherit; font: inherit; }
        input:focus, select:focus, textarea:focus { outline: 3px solid rgba(0, 116, 156, .25); border-color: #00749c; }
        button { border: 1px solid #1b1712; background: #00749c; color: white; padding: 10px 15px; font: 700 13px/1 inherit; cursor: pointer; }
        .login-card button { width: 100%; margin-top: 16px; }
        button.secondary { background: transparent; color: #1b1712; }
        .inbox-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
        .inbox-header p:last-child { margin: 0; color: #5c554c; }
        .growth-section { margin-bottom: 56px; }
        .section-heading, .feedback-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .section-heading > p, .feedback-heading > p { margin: 0; color: #6d665d; font-size: 13px; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .metric-card { display: grid; gap: 5px; min-height: 112px; padding: 17px; border: 1px solid #bdb6aa; background: #fffefa; }
        .metric-card p { margin: 0; color: #5c554c; font-size: 12px; font-weight: 700; }
        .metric-card strong { font: 700 34px/1 Charter, Cambria, Georgia, serif; }
        .metric-card span { align-self: end; color: #6d665d; font-size: 11px; }
        .daily-wrap { overflow-x: auto; margin-top: 18px; border: 1px solid #bdb6aa; background: #fffefa; }
        table { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 12px; text-align: right; }
        caption { padding: 12px 14px; text-align: left; color: #5c554c; font-weight: 700; }
        th, td { padding: 9px 11px; border-top: 1px solid #ded8ce; }
        thead th { background: #eeece7; color: #5c554c; }
        th:first-child { text-align: left; }
        .feedback-heading { margin-top: 10px; }
        .feedback-list { display: grid; gap: 24px; }
        .feedback-card { padding: 22px; scroll-margin-top: 20px; }
        .feedback-card--new { border-left: 6px solid #00749c; }
        .feedback-card > header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .badges { display: flex; flex-wrap: wrap; gap: 7px; }
        .badge, .status { border: 1px solid #bdb6aa; padding: 3px 7px; font: 700 11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; }
        .status--new { border-color: #00749c; background: #e7f5fa; color: #005d7d; }
        .status--planned { border-color: #2d5f4f; background: #e6efeb; color: #21473b; }
        .status--resolved { background: #eeece7; }
        time { color: #6d665d; font-size: 12px; white-space: nowrap; }
        .message { margin: 22px 0; font: 20px/1.55 Charter, Cambria, Georgia, serif; white-space: pre-wrap; }
        dl { display: grid; gap: 7px; padding: 14px 0; border-top: 1px solid #ded8ce; border-bottom: 1px solid #ded8ce; font-size: 13px; }
        dl div { display: grid; grid-template-columns: 76px 1fr; gap: 10px; }
        dt { color: #6d665d; } dd { margin: 0; overflow-wrap: anywhere; } a { color: #00658a; }
        .review-form { display: grid; grid-template-columns: 150px 1fr auto; gap: 12px; align-items: end; margin-top: 16px; }
        .empty { padding: 40px; text-align: center; color: #6d665d; }
        .error { border: 1px solid #b32d2e; background: #fff0f0; color: #8b1f20; padding: 12px; }
        @media (max-width: 720px) {
          .feedback-shell { padding: 32px 16px 72px; }
          .inbox-header, .section-heading, .feedback-heading, .feedback-card > header { align-items: flex-start; flex-direction: column; }
          .metric-grid { grid-template-columns: 1fr 1fr; }
          .review-form { grid-template-columns: 1fr; }
          time { white-space: normal; }
        }
        @media (max-width: 460px) { .metric-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
