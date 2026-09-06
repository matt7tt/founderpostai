import crypto from 'crypto';

const PURPOSE = 'aisuite-pro-download-v1';
function secret() {
  const key = process.env.GATEWAY_KMS_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('Download signing is not configured');
  return key;
}
export function createDownloadToken(subscriptionId: string, lifetime = 24 * 60 * 60, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sub: subscriptionId, exp: Math.floor(now / 1000) + lifetime })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(`${PURPOSE}:${payload}`).digest('base64url');
  return `${payload}.${signature}`;
}
export function verifyDownloadToken(token: string, now = Date.now()): string | null {
  if (token.length > 1024) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', secret()).update(`${PURPOSE}:${parts[0]}`).digest();
  const actual = Buffer.from(parts[1], 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return typeof data.sub === 'string' && /^sub_[A-Za-z0-9]+$/.test(data.sub) &&
      Number.isInteger(data.exp) && data.exp > Math.floor(now / 1000) ? data.sub : null;
  } catch { return null; }
}
export function proDownloadUrl(subscriptionId: string) {
  return `https://founderpostai.com/api/downloads/seo-pro?token=${encodeURIComponent(createDownloadToken(subscriptionId))}`;
}
