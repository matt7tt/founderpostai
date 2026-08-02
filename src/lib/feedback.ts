import { randomId } from './gateway/crypto';
import { getJSON, redis, setJSON } from './gateway/redis';
import type { Site } from './gateway/store';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRODUCTS,
  FEEDBACK_STATUSES,
  type FeedbackInput,
  type FeedbackProduct,
  type FeedbackRecord,
  type FeedbackStatus,
  type FeedbackCategory,
} from './feedback-shared';

export type { FeedbackInput, FeedbackRecord } from './feedback-shared';

export class FeedbackValidationError extends Error {}
export class FeedbackRateLimitError extends Error {}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isEmail(value: string): boolean {
  return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateFeedbackInput(value: unknown): FeedbackInput {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const category = cleanString(input.category, 20) as FeedbackCategory;
  const product = cleanString(input.product, 20) as FeedbackProduct;
  const message = cleanString(input.message, 3000);
  const contactEmail = cleanString(input.contact_email, 254).toLowerCase();

  if (!FEEDBACK_CATEGORIES.includes(category)) {
    throw new FeedbackValidationError('Choose a valid feedback type.');
  }
  if (!FEEDBACK_PRODUCTS.includes(product)) {
    throw new FeedbackValidationError('Choose a valid plugin.');
  }
  if (message.length < 10) {
    throw new FeedbackValidationError('Please provide at least 10 characters of detail.');
  }
  if (!isEmail(contactEmail)) {
    throw new FeedbackValidationError('Enter a valid reply email or leave it blank.');
  }

  return {
    category,
    product,
    message,
    contact_email: contactEmail,
    plugin_version: cleanString(input.plugin_version, 32),
    core_version: cleanString(input.core_version, 32),
    wp_version: cleanString(input.wp_version, 32),
    php_version: cleanString(input.php_version, 32),
  };
}

async function enforceFeedbackRateLimit(siteId: string): Promise<void> {
  const script = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;
  const count = Number(await redis('EVAL', script, 1, `feedback-rate:${siteId}`, 3600));
  if (count > 5) {
    throw new FeedbackRateLimitError('Too many submissions. Please try again in about an hour.');
  }
}

export async function createFeedback(site: Site, input: FeedbackInput): Promise<FeedbackRecord> {
  await enforceFeedbackRateLimit(site.site_id);

  const now = new Date().toISOString();
  const record: FeedbackRecord = {
    ...input,
    id: randomId('fb'),
    site_id: site.site_id,
    site_url: site.site_url,
    status: 'new',
    admin_notes: '',
    created_at: now,
    updated_at: now,
  };

  await setJSON(`feedback:${record.id}`, record);
  await redis('ZADD', 'feedback:index', Date.now(), record.id);
  return record;
}

export async function listFeedback(limit = 250): Promise<FeedbackRecord[]> {
  const safeLimit = Math.min(500, Math.max(1, Math.floor(limit)));
  const ids = (await redis('ZREVRANGE', 'feedback:index', 0, safeLimit - 1)) as string[] | null;
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const values = (await redis('MGET', ...ids.map((id) => `feedback:${id}`))) as Array<
    string | null
  >;
  if (!Array.isArray(values)) return [];

  return values.flatMap((value) => {
    if (!value) return [];
    try {
      return [JSON.parse(value) as FeedbackRecord];
    } catch {
      return [];
    }
  });
}

export async function updateFeedback(
  id: string,
  status: FeedbackStatus,
  adminNotes: string
): Promise<FeedbackRecord | null> {
  if (!FEEDBACK_STATUSES.includes(status)) return null;
  const record = await getJSON<FeedbackRecord>(`feedback:${id}`);
  if (!record) return null;

  const updated: FeedbackRecord = {
    ...record,
    status,
    admin_notes: adminNotes.trim().slice(0, 3000),
    updated_at: new Date().toISOString(),
  };
  await setJSON(`feedback:${id}`, updated);
  return updated;
}
