import type { GetServerSideProps } from 'next';
import SeoHead from '@/components/SeoHead';
import { listFeedback } from '@/lib/feedback';
import {
  feedbackAdminConfigured,
  isFeedbackAdminRequest,
} from '@/lib/feedback-admin';
import { FEEDBACK_STATUSES, type FeedbackRecord } from '@/lib/feedback-shared';

interface FeedbackReviewProps {
  authenticated: boolean;
  configured: boolean;
  feedback: FeedbackRecord[];
  loadError: string;
  loginError: boolean;
}

const productNames: Record<string, string> = {
  core: 'AI Suite Core',
  seo: 'AI Suite SEO',
  'seo-pro': 'AI Suite SEO Pro',
};

export const getServerSideProps: GetServerSideProps<FeedbackReviewProps> = async ({ req, res, query }) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const configured = feedbackAdminConfigured();
  const authenticated = configured && isFeedbackAdminRequest(req);
  let feedback: FeedbackRecord[] = [];
  let loadError = '';

  if (authenticated) {
    try {
      feedback = await listFeedback();
    } catch (error) {
      console.error('Feedback inbox failed to load:', error);
      loadError = 'The feedback store could not be reached. Try refreshing in a moment.';
    }
  }

  return { props: { authenticated, configured, feedback, loadError, loginError: query.error === '1' } };
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value));
}

export default function FeedbackReview({
  authenticated,
  configured,
  feedback,
  loadError,
  loginError,
}: FeedbackReviewProps) {
  const newCount = feedback.filter((item) => item.status === 'new').length;

  return (
    <>
      <SeoHead
        title="Plugin Feedback Inbox | FounderPostAI"
        description="Private FounderPostAI plugin feedback review inbox."
        path="/feedback-review"
        noIndex
      />
      <main className="feedback-shell">
        {!authenticated ? (
          <section className="login-card">
            <p className="eyebrow">FounderPostAI · Private</p>
            <h1>Plugin feedback</h1>
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
                <h1>Plugin feedback</h1>
                <p>{newCount} new · {feedback.length} total shown</p>
              </div>
              <form method="post" action="/api/feedback-admin/logout">
                <button type="submit" className="secondary">Sign out</button>
              </form>
            </header>

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
          .inbox-header, .feedback-card > header { align-items: flex-start; flex-direction: column; }
          .review-form { grid-template-columns: 1fr; }
          time { white-space: normal; }
        }
      `}</style>
    </>
  );
}
