import crypto from 'node:crypto';
import { encrypt, decrypt } from './gateway/crypto';
import { redis } from './gateway/redis';

export interface EmailMessage { from: string; to: string; subject: string; text: string; reply_to: string }
interface OutboxRecord {
  status: 'queued' | 'sending' | 'sent';
  encrypted?: string;
  attempts: number;
  createdAt: number;
  nextAttempt: number;
  lease?: string;
  lastError?: string;
  messageId?: string;
}
const OUTBOX = 'transactional-email:pending';
const RETENTION = 30 * 24 * 60 * 60;

export function emailDigest(value: string): string {
  const key = process.env.GATEWAY_KMS_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('Email encryption is not configured');
  return crypto.createHmac('sha256', key).update(`email-v1:${value}`).digest('hex');
}
export function normalizedEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}
export function emailMessage(to: string, subject: string, text: string): EmailMessage {
  const from = normalizedEmail(process.env.RESEND_FROM_EMAIL);
  if (!from) throw new Error('Email sender is not configured');
  return { from: `FounderPostAI <${from}>`, reply_to: from, to, subject, text };
}

/** Payload and queue membership are atomic; retries never recreate an accepted purchase email. */
export async function queueEmail(id: string, message: EmailMessage): Promise<void> {
  const record: OutboxRecord = { status: 'queued', encrypted: encrypt(JSON.stringify(message)), attempts: 0, createdAt: Date.now(), nextAttempt: Date.now() };
  await redis('EVAL', `
    if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[3])
    redis.call('ZADD', KEYS[2], ARGV[2], ARGV[4])
    return 1
  `, 2, `transactional-email:${id}`, OUTBOX, JSON.stringify(record), record.nextAttempt, RETENTION, id);
}

export async function sendWithResend(message: EmailMessage, id: string): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('resend_not_configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `founderpostai/${id}` },
    body: JSON.stringify(message), signal: AbortSignal.timeout(8000),
  });
  // Do not log provider response bodies: validation errors can echo recipients or message content.
  if (!response.ok) throw new Error(`resend_http_${response.status}`);
  const data = await response.json();
  if (typeof data.id !== 'string') throw new Error('resend_invalid_response');
  return data.id;
}

export async function deliverEmail(id: string, now = Date.now()): Promise<'sent' | 'queued'> {
  const lease = crypto.randomUUID();
  const key = `transactional-email:${id}`;
  const raw = await redis('EVAL', `
    local raw = redis.call('GET', KEYS[1])
    if not raw then redis.call('ZREM', KEYS[2], ARGV[4]); return nil end
    local item = cjson.decode(raw)
    if item.status == 'sent' then return 'SENT' end
    local ttl = tonumber(ARGV[3]) - math.floor((tonumber(ARGV[1]) - item.createdAt) / 1000)
    if ttl <= 0 then redis.call('DEL', KEYS[1]); redis.call('ZREM', KEYS[2], ARGV[4]); return nil end
    if item.nextAttempt > tonumber(ARGV[1]) then return nil end
    item.status = 'sending'; item.lease = ARGV[2]; item.attempts = item.attempts + 1
    item.nextAttempt = tonumber(ARGV[1]) + 60000
    redis.call('SET', KEYS[1], cjson.encode(item), 'EX', ttl)
    redis.call('ZADD', KEYS[2], item.nextAttempt, ARGV[4])
    return cjson.encode(item)
  `, 2, key, OUTBOX, now, lease, RETENTION, id);
  if (raw === 'SENT') return 'sent';
  if (!raw) return 'queued';
  const record: OutboxRecord = JSON.parse(raw);
  let sent = false;
  try {
    const message = JSON.parse(decrypt(record.encrypted!)) as EmailMessage;
    record.messageId = await sendWithResend(message, id);
    record.status = 'sent';
    delete record.encrypted;
    delete record.lastError;
    sent = true;
  } catch (error) {
    record.status = 'queued';
    const code = error instanceof Error ? error.message : '';
    record.lastError = /^resend_[a-z0-9_]+$/.test(code) ? code : 'email_delivery_unavailable';
    record.nextAttempt = now + Math.min(6 * 3600000, 60000 * 2 ** Math.min(record.attempts, 8));
    console.warn('Transactional email queued for retry', { code: record.lastError });
  }
  await redis('EVAL', `
    local raw = redis.call('GET', KEYS[1])
    if not raw or cjson.decode(raw).lease ~= ARGV[1] then return 0 end
    if ARGV[3] == 'sent' then
      redis.call('SET', KEYS[1], ARGV[2])
      redis.call('ZREM', KEYS[2], ARGV[4])
    else
      redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[5])
      redis.call('ZADD', KEYS[2], ARGV[6], ARGV[4])
    end
    return 1
  `, 2, key, OUTBOX, lease, JSON.stringify(record), record.status, id,
  Math.max(1, RETENTION - Math.floor((Date.now() - record.createdAt) / 1000)), record.nextAttempt);
  return sent ? 'sent' : 'queued';
}

export async function retryEmails() {
  const ids: string[] = await redis('ZRANGEBYSCORE', OUTBOX, '-inf', Date.now(), 'LIMIT', 0, 25);
  const start = Date.now();
  let sent = 0;
  for (const id of ids) {
    if (Date.now() - start > 35000) break;
    if (await deliverEmail(id) === 'sent') sent++;
    // Respect Resend's default two-requests-per-second sending limit.
    await new Promise(resolve => setTimeout(resolve, 600));
  }
  return { sent, pending: Number(await redis('ZCARD', OUTBOX)) };
}
