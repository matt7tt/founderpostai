import { randomBytes } from 'crypto';
import { decrypt, encrypt } from './crypto';
import { getJSON, redis, setJSON } from './redis';
import { getSite, Site } from './store';

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_API_ROOT = 'https://www.googleapis.com/webmasters/v3';

interface OAuthState {
  site_id: string;
  return_url: string;
}

interface GscConnection {
  refresh_token: string;
  access_token: string;
  expires_at: number;
  property: string;
  connected_at: string;
}

function clientConfig() {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI || '';
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Search Console integration is not configured.');
  }
  return { clientId, clientSecret, redirectUri };
}

function connectionKey(siteId: string) {
  return `gsc:${siteId}`;
}

function stateKey(state: string) {
  return `gsc-state:${state}`;
}

export function validateGscReturnUrl(site: Site, value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Invalid return URL.');
  const target = new URL(value);
  const home = new URL(site.site_url);
  if (target.origin !== home.origin || !target.pathname.includes('/wp-admin/')) {
    throw new Error('The Search Console return URL must be on the connected WordPress admin.');
  }
  return target.toString();
}

export async function createGscAuthorizationUrl(site: Site, returnUrl: string): Promise<string> {
  const { clientId, redirectUri } = clientConfig();
  const state = randomBytes(32).toString('hex');
  await setJSON(
    stateKey(state),
    { site_id: site.site_id, return_url: validateGscReturnUrl(site, returnUrl) },
    10 * 60
  );
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GSC_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  }).toString();
  return url.toString();
}

export async function consumeGscState(state: string): Promise<OAuthState> {
  if (!/^[a-f0-9]{64}$/.test(state)) throw new Error('Invalid OAuth state.');
  const raw = await redis('GETDEL', stateKey(state));
  if (!raw) throw new Error('This Search Console connection link expired or was already used.');
  const record = JSON.parse(raw) as OAuthState;
  const site = await getSite(record.site_id);
  if (!site) throw new Error('The connected WordPress site no longer exists.');
  record.return_url = validateGscReturnUrl(site, record.return_url);
  return record;
}

export async function exchangeGscCode(record: OAuthState, code: string): Promise<void> {
  const { clientId, clientSecret, redirectUri } = clientConfig();
  if (!code || code.length > 4096) throw new Error('Google did not return a valid authorization code.');
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || typeof token.refresh_token !== 'string' || typeof token.access_token !== 'string') {
    throw new Error(token?.error_description || 'Google did not return reusable Search Console access.');
  }
  await setJSON(
    connectionKey(record.site_id),
    {
      refresh_token: encrypt(token.refresh_token),
      access_token: encrypt(token.access_token),
      expires_at: Date.now() + Math.max(60, Number(token.expires_in) || 3600) * 1000,
      property: '',
      connected_at: new Date().toISOString(),
    } satisfies GscConnection
  );
}

async function getConnection(siteId: string): Promise<GscConnection | null> {
  return getJSON<GscConnection>(connectionKey(siteId));
}

async function accessToken(siteId: string): Promise<string> {
  const connection = await getConnection(siteId);
  if (!connection) throw new Error('Search Console is not connected.');
  if (connection.access_token && connection.expires_at > Date.now() + 60_000) {
    return decrypt(connection.access_token);
  }
  const { clientId, clientSecret } = clientConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: decrypt(connection.refresh_token),
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || typeof token.access_token !== 'string') {
    throw new Error(token?.error_description || 'Google Search Console access expired. Reconnect it in WordPress.');
  }
  connection.access_token = encrypt(token.access_token);
  connection.expires_at = Date.now() + Math.max(60, Number(token.expires_in) || 3600) * 1000;
  await setJSON(connectionKey(siteId), connection);
  return token.access_token;
}

async function googleRequest(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Search Console returned HTTP ${response.status}.`);
  return data;
}

export async function listGscProperties(siteId: string) {
  const token = await accessToken(siteId);
  const data = await googleRequest(`${GSC_API_ROOT}/sites`, token);
  return (Array.isArray(data.siteEntry) ? data.siteEntry : [])
    .filter((entry: any) => entry && typeof entry.siteUrl === 'string')
    .map((entry: any) => ({
      site_url: entry.siteUrl.slice(0, 2048),
      permission: typeof entry.permissionLevel === 'string' ? entry.permissionLevel.slice(0, 50) : '',
    }));
}

export async function gscStatus(siteId: string) {
  const connection = await getConnection(siteId);
  if (!connection) return { connected: false, property: '', properties: [] };
  const properties = await listGscProperties(siteId);
  return {
    connected: true,
    property: connection.property || '',
    connected_at: connection.connected_at,
    properties,
  };
}

export async function selectGscProperty(siteId: string, property: string) {
  const connection = await getConnection(siteId);
  if (!connection) throw new Error('Search Console is not connected.');
  const properties = await listGscProperties(siteId);
  if (!properties.some((entry: { site_url: string }) => entry.site_url === property)) {
    throw new Error('Choose a Search Console property available to this Google account.');
  }
  connection.property = property;
  await setJSON(connectionKey(siteId), connection);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(days: number, offsetDays = 0) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3 - offsetDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

async function searchAnalytics(siteId: string, property: string, body: Record<string, any>) {
  const token = await accessToken(siteId);
  return googleRequest(
    `${GSC_API_ROOT}/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

export function normalizeGscRows(rows: unknown) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 2500).map((row: any) => ({
    query: typeof row?.keys?.[0] === 'string' ? row.keys[0].slice(0, 500) : '',
    page: typeof row?.keys?.[1] === 'string' ? row.keys[1].slice(0, 2048) : '',
    clicks: Math.max(0, Number(row?.clicks) || 0),
    impressions: Math.max(0, Number(row?.impressions) || 0),
    ctr: Math.min(1, Math.max(0, Number(row?.ctr) || 0)),
    position: Math.max(0, Number(row?.position) || 0),
  }));
}

function summaryRow(data: any) {
  const row = Array.isArray(data?.rows) && data.rows[0] ? data.rows[0] : {};
  return {
    clicks: Math.max(0, Number(row.clicks) || 0),
    impressions: Math.max(0, Number(row.impressions) || 0),
    ctr: Math.min(1, Math.max(0, Number(row.ctr) || 0)),
    position: Math.max(0, Number(row.position) || 0),
  };
}

export async function gscPerformance(siteId: string, requestedDays: number) {
  const connection = await getConnection(siteId);
  if (!connection?.property) throw new Error('Choose a Search Console property first.');
  const days = Math.max(7, Math.min(90, requestedDays || 28));
  const current = dateRange(days);
  const previous = dateRange(days, days);
  const [summary, previousSummary, details] = await Promise.all([
    searchAnalytics(siteId, connection.property, { ...current, type: 'web' }),
    searchAnalytics(siteId, connection.property, { ...previous, type: 'web' }),
    searchAnalytics(siteId, connection.property, {
      ...current,
      type: 'web',
      dimensions: ['query', 'page'],
      rowLimit: 2500,
      dataState: 'final',
    }),
  ]);
  return {
    property: connection.property,
    period: { ...current, days },
    summary: summaryRow(summary),
    previous: summaryRow(previousSummary),
    rows: normalizeGscRows(details?.rows),
  };
}

export async function disconnectGsc(siteId: string) {
  const connection = await getConnection(siteId);
  if (connection?.refresh_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decrypt(connection.refresh_token))}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Local deletion is authoritative; an unreachable revoke endpoint must not trap the token here.
    }
  }
  await redis('DEL', connectionKey(siteId));
}
