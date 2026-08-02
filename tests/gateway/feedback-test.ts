import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import {
  createFeedbackAdminSession,
  FEEDBACK_ADMIN_COOKIE,
  isFeedbackAdminRequest,
  isSameOrigin,
  passwordMatches,
} from '../../src/lib/feedback-admin';
import {
  FeedbackValidationError,
  validateFeedbackInput,
} from '../../src/lib/feedback';

process.env.FEEDBACK_ADMIN_PASSWORD = 'feedback-test-password';
process.env.FEEDBACK_ADMIN_SESSION_SECRET = 'feedback-test-session-secret-with-enough-entropy';

const valid = validateFeedbackInput({
  category: 'bug',
  product: 'seo',
  message: 'The review queue did not update after the callback.',
  contact_email: 'ADMIN@EXAMPLE.COM',
  plugin_version: '0.1.4',
  core_version: '0.1.4',
  wp_version: '7.0',
  php_version: '8.3.1',
});
assert.equal(valid.contact_email, 'admin@example.com');
assert.equal(valid.product, 'seo');

assert.throws(
  () => validateFeedbackInput({ category: 'complaint', product: 'seo', message: 'Enough detail here.' }),
  FeedbackValidationError
);
assert.throws(
  () => validateFeedbackInput({ category: 'bug', product: 'seo', message: 'short' }),
  FeedbackValidationError
);

assert.equal(passwordMatches('feedback-test-password'), true);
assert.equal(passwordMatches('wrong-password'), false);

const session = createFeedbackAdminSession();
const request = {
  headers: {
    cookie: `${FEEDBACK_ADMIN_COOKIE}=${encodeURIComponent(session)}`,
    host: 'founderpostai.com',
    origin: 'https://founderpostai.com',
  },
} as IncomingMessage;
assert.equal(isFeedbackAdminRequest(request), true);
assert.equal(isSameOrigin(request), true);

request.headers.cookie = `${FEEDBACK_ADMIN_COOKIE}=${encodeURIComponent(`${session}tampered`)}`;
assert.equal(isFeedbackAdminRequest(request), false);
request.headers.origin = 'https://attacker.example';
assert.equal(isSameOrigin(request), false);

console.log('PASS: feedback validation and private inbox authentication reject invalid input');
