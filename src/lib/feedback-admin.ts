import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

export const FEEDBACK_ADMIN_COOKIE = 'founderpostai_feedback_admin';
const SESSION_SECONDS = 12 * 60 * 60;

function sessionSecret(): string {
  return (
    process.env.FEEDBACK_ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.GATEWAY_KMS_KEY ||
    ''
  );
}

function signature(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cookies(req: IncomingMessage): Record<string, string> {
  return (req.headers.cookie || '').split(';').reduce<Record<string, string>>((result, part) => {
    const index = part.indexOf('=');
    if (index === -1) return result;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) result[name] = decodeURIComponent(value);
    return result;
  }, {});
}

export function feedbackAdminConfigured(): boolean {
  return Boolean(process.env.FEEDBACK_ADMIN_PASSWORD && sessionSecret());
}

export function passwordMatches(candidate: unknown): boolean {
  const expected = process.env.FEEDBACK_ADMIN_PASSWORD || '';
  return typeof candidate === 'string' && expected.length >= 12 && safeEqual(candidate, expected);
}

export function createFeedbackAdminSession(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }),
    'utf8'
  ).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function isFeedbackAdminRequest(req: IncomingMessage): boolean {
  if (!feedbackAdminConfigured()) return false;
  const value = cookies(req)[FEEDBACK_ADMIN_COOKIE] || '';
  const [payload, givenSignature] = value.split('.');
  if (!payload || !givenSignature || !safeEqual(givenSignature, signature(payload))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
    };
    return typeof session.exp === 'number' && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function feedbackAdminCookie(value: string, maxAge = SESSION_SECONDS): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${FEEDBACK_ADMIN_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function isSameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (typeof origin !== 'string' || typeof host !== 'string') return false;
  try {
    return new URL(origin).host === host.split(',')[0].trim();
  } catch {
    return false;
  }
}

export function requireFeedbackAdmin(
  req: IncomingMessage,
  res: ServerResponse & { statusCode: number; end: (body?: string) => void }
): boolean {
  if (!isFeedbackAdminRequest(req) || !isSameOrigin(req)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return false;
  }
  return true;
}
