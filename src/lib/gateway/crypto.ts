import crypto from 'crypto';

export function sign(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function signRequest(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  rawBody: string
): string {
  const canonical = `${method.toUpperCase()}\n${path}\n${rawBody}`;
  return sign(secret, timestamp, canonical);
}

export function canonicalRequestPath(url = ''): string {
  const parsed = new URL(url, 'http://gateway.local');
  const pathname = parsed.pathname.startsWith('/api/gateway')
    ? parsed.pathname.slice('/api/gateway'.length)
    : parsed.pathname;
  return `${pathname || '/'}${parsed.search}`;
}

// Verify an inbound (WP → gateway) request. Returns error string or null.
export function verifyInbound(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
  secret: string,
  method = '',
  path = ''
): string | null {
  const ts = headers['x-aisuite-timestamp'];
  const sig = headers['x-aisuite-signature'];
  if (typeof ts !== 'string' || typeof sig !== 'string') return 'Missing signature headers';
  if (!/^\d{10,}$/.test(ts) || !/^[a-f0-9]{64}$/i.test(sig)) return 'Malformed signature headers';
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(ts, 10));
  if (age > 300) return 'Timestamp outside 300s window';
  const version = headers['x-aisuite-signature-version'];
  const expected =
    version === '2' ? signRequest(secret, ts, method, path, rawBody) : sign(secret, ts, rawBody);
  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — that must be a 401, not a 500.
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return 'Bad signature';
  return null;
}

export function outboundHeaders(secret: string, rawBody: string, siteId: string) {
  const ts = Math.floor(Date.now() / 1000).toString();
  return {
    'Content-Type': 'application/json',
    'X-AISuite-Site': siteId,
    'X-AISuite-Timestamp': ts,
    'X-AISuite-Signature': sign(secret, ts, rawBody),
    'X-AISuite-Plugin': 'gateway',
  };
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

export function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env.GATEWAY_KMS_KEY || '', 'hex');
  if (key.length !== 32) throw new Error('GATEWAY_KMS_KEY must be 64 hex chars');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

export function decrypt(blob: string): string {
  const key = Buffer.from(process.env.GATEWAY_KMS_KEY || '', 'hex');
  const buf = Buffer.from(blob, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}
