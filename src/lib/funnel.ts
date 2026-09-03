import crypto from 'crypto';
import { redis } from './gateway/redis';

export const FUNNEL_EVENTS = [
  'page_view',
  'core_install_click',
  'seo_download_click',
  'pro_checkout_click',
  'agency_checkout_click',
  'connection_code_created',
  'site_connected',
  'first_job_completed',
  'purchase_completed',
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export interface FunnelMetric {
  last30: number;
  last7: number;
  previous7: number;
}

export interface FunnelDay {
  date: string;
  counts: Record<FunnelEvent, number>;
}

export interface FunnelReport {
  generatedAt: string;
  retentionDays: number;
  metrics: Record<FunnelEvent, FunnelMetric>;
  daily: FunnelDay[];
  topPaths: FunnelPath[];
}

export interface FunnelPath {
  path: string;
  counts: Record<FunnelEvent, number>;
}

const RETENTION_DAYS = 180;
const RETENTION_SECONDS = RETENTION_DAYS * 24 * 60 * 60;
const PATH_EVENTS: FunnelEvent[] = [
  'page_view',
  'core_install_click',
  'seo_download_click',
  'pro_checkout_click',
  'agency_checkout_click',
];

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === 'string' && FUNNEL_EVENTS.includes(value as FunnelEvent);
}

export function normalizeFunnelPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '';
  const path = value.split('?')[0].split('#')[0].trim();
  return path ? path.slice(0, 160) : '/';
}

function utcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function recentDays(total: number, now = new Date()): string[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: total }, (_, index) =>
    utcDay(new Date(end - (total - index - 1) * 24 * 60 * 60 * 1000))
  );
}

function countKey(day: string, event: FunnelEvent): string {
  return `funnel:count:${day}:${event}`;
}

function pathKey(day: string, event: FunnelEvent): string {
  return `funnel:path:${day}:${event}`;
}

export async function recordFunnelEvent(
  event: FunnelEvent,
  path: unknown = '',
  now = new Date()
): Promise<void> {
  const day = utcDay(now);
  const safePath = normalizeFunnelPath(path);
  const script = `
    local count = redis.call('INCR', KEYS[1])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    if ARGV[1] ~= '' then
      redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
      redis.call('EXPIRE', KEYS[2], ARGV[2])
    end
    return count
  `;
  await redis(
    'EVAL',
    script,
    2,
    countKey(day, event),
    pathKey(day, event),
    safePath,
    RETENTION_SECONDS
  );
}

export async function recordUniqueFunnelEvent(
  event: FunnelEvent,
  uniqueId: string,
  path: unknown = '',
  now = new Date()
): Promise<boolean> {
  const day = utcDay(now);
  const safePath = normalizeFunnelPath(path);
  const digest = crypto.createHash('sha256').update(`${event}:${uniqueId}`).digest('hex');
  const script = `
    local claimed = redis.call('SET', KEYS[1], '1', 'NX', 'EX', ARGV[2])
    if not claimed then return 0 end
    redis.call('INCR', KEYS[2])
    redis.call('EXPIRE', KEYS[2], ARGV[2])
    if ARGV[1] ~= '' then
      redis.call('HINCRBY', KEYS[3], ARGV[1], 1)
      redis.call('EXPIRE', KEYS[3], ARGV[2])
    end
    return 1
  `;
  const recorded = await redis(
    'EVAL',
    script,
    3,
    `funnel:unique:${event}:${digest}`,
    countKey(day, event),
    pathKey(day, event),
    safePath,
    RETENTION_SECONDS
  );
  return Number(recorded) === 1;
}

export async function recordFunnelEventSafely(
  event: FunnelEvent,
  path: unknown = ''
): Promise<void> {
  try {
    await recordFunnelEvent(event, path);
  } catch (error) {
    console.warn(`Funnel event failed: event=${event}`, error);
  }
}

export async function recordUniqueFunnelEventSafely(
  event: FunnelEvent,
  uniqueId: string,
  path: unknown = ''
): Promise<void> {
  try {
    await recordUniqueFunnelEvent(event, uniqueId, path);
  } catch (error) {
    console.warn(`Unique funnel event failed: event=${event}`, error);
  }
}

function emptyCounts(): Record<FunnelEvent, number> {
  return Object.fromEntries(FUNNEL_EVENTS.map((event) => [event, 0])) as Record<
    FunnelEvent,
    number
  >;
}

export async function getFunnelReport(now = new Date()): Promise<FunnelReport> {
  const days = recentDays(30, now);
  const keys = days.flatMap((day) => FUNNEL_EVENTS.map((event) => countKey(day, event)));
  const raw = (await redis('MGET', ...keys)) as Array<string | number | null> | null;
  const daily = days.map((date) => ({ date, counts: emptyCounts() }));

  if (Array.isArray(raw)) {
    let offset = 0;
    for (const day of daily) {
      for (const event of FUNNEL_EVENTS) {
        day.counts[event] = Number(raw[offset] || 0);
        offset += 1;
      }
    }
  }

  const metrics = Object.fromEntries(
    FUNNEL_EVENTS.map((event) => {
      const values = daily.map((day) => day.counts[event]);
      const sum = (items: number[]) => items.reduce((total, value) => total + value, 0);
      return [
        event,
        {
          last30: sum(values),
          last7: sum(values.slice(-7)),
          previous7: sum(values.slice(-14, -7)),
        },
      ];
    })
  ) as Record<FunnelEvent, FunnelMetric>;

  const pathScript = `
    local totals = {}
    for _, key in ipairs(KEYS) do
      local entries = redis.call('HGETALL', key)
      for index = 1, #entries, 2 do
        local path = entries[index]
        totals[path] = (totals[path] or 0) + tonumber(entries[index + 1])
      end
    end
    local result = {}
    for path, total in pairs(totals) do
      table.insert(result, path)
      table.insert(result, tostring(total))
    end
    return result
  `;
  const pathResults = await Promise.all(
    PATH_EVENTS.map((event) =>
      redis('EVAL', pathScript, days.length, ...days.map((day) => pathKey(day, event)))
    )
  );
  const paths = new Map<string, Record<FunnelEvent, number>>();
  pathResults.forEach((result, eventIndex) => {
    if (!Array.isArray(result)) return;
    const event = PATH_EVENTS[eventIndex];
    for (let index = 0; index < result.length; index += 2) {
      const path = String(result[index] || '');
      if (!path) continue;
      const counts = paths.get(path) || emptyCounts();
      counts[event] = Number(result[index + 1] || 0);
      paths.set(path, counts);
    }
  });
  const topPaths = Array.from(paths, ([path, counts]) => ({ path, counts }))
    .sort((left, right) => {
      const leftActions =
        left.counts.core_install_click +
        left.counts.seo_download_click +
        left.counts.pro_checkout_click +
        left.counts.agency_checkout_click;
      const rightActions =
        right.counts.core_install_click +
        right.counts.seo_download_click +
        right.counts.pro_checkout_click +
        right.counts.agency_checkout_click;
      return right.counts.page_view - left.counts.page_view || rightActions - leftActions;
    })
    .slice(0, 25);

  return {
    generatedAt: now.toISOString(),
    retentionDays: RETENTION_DAYS,
    metrics,
    daily: daily.slice(-14),
    topPaths,
  };
}
