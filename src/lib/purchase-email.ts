import { encrypt, decrypt } from './gateway/crypto';
import { redis } from './gateway/redis';
import { emailDigest, normalizedEmail, emailMessage, queueEmail } from './transactional-email';
import { PLAN_LABELS } from './license';

interface Receipt { sessionId: string; subscriptionId: string; email: string; licenseKey: string; plan: string }
const receiptUrl = (id: string) => `https://founderpostai.com/thanks?session_id=${encodeURIComponent(id)}`;

export async function preparePurchaseEmail(receipt: Receipt): Promise<string | null> {
  const email = normalizedEmail(receipt.email);
  if (!email) return null;
  const normalized = { ...receipt, email };
  // HMAC lookup keys hide email addresses; receipt references are encrypted at rest.
  await redis('HSET', `purchase-email:${emailDigest(email)}`, receipt.subscriptionId, encrypt(JSON.stringify(normalized)));
  const id = emailDigest(`purchase:${receipt.subscriptionId}`);
  await queueEmail(id, emailMessage(email, 'Your FounderPostAI license and downloads', [
    `Thank you for purchasing ${PLAN_LABELS[receipt.plan] || 'AI Suite SEO Pro'}.`,
    `Your license key: ${receipt.licenseKey}`,
    `Your private purchase page: ${receiptUrl(receipt.sessionId)}`,
    'Open that page for fresh Pro downloads, billing, cancellation, and site activation management. Keep the link private.',
    'Installation: install AI Suite Core from WordPress.org, upload the free SEO module, then upload SEO Pro. Connect Core under AI Suite → Connection and enter this key under AI Suite → SEO Pro.',
    'Free plugins and installation instructions: https://founderpostai.com/ai-suite#installation',
    'Need help? https://founderpostai.com/contact',
  ].join('\n\n')));
  return id;
}

export async function prepareRecoveryEmail(email: string): Promise<string | null> {
  const values: string[] = await redis('HVALS', `purchase-email:${emailDigest(email)}`);
  const receipts = values.slice(0, 20).map(value => JSON.parse(decrypt(value)) as Receipt).filter(receipt => receipt.email === email);
  if (!receipts.length) return null;
  // One immutable recovery message per email and 15-minute window, including concurrent requests.
  const id = emailDigest(`recovery:${email}:${Math.floor(Date.now() / 900000)}`);
  await queueEmail(id, emailMessage(email, 'Recover your FounderPostAI purchases', [
    'Here are the purchases recorded for this checkout email address:',
    ...receipts.map(receipt => `${PLAN_LABELS[receipt.plan] || 'AI Suite SEO Pro'}\nLicense: ${receipt.licenseKey}\nPrivate purchase page: ${receiptUrl(receipt.sessionId)}`),
    'These private pages show your current subscription status and provide eligible downloads and billing management. Receiving this email does not renew an inactive subscription.',
    'If you did not request this email, you can ignore it. Your account and subscription have not changed.',
    'Need help? https://founderpostai.com/contact',
  ].join('\n\n')));
  return id;
}
