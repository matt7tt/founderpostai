import { redis } from './redis';
import type { Job, Site } from './store';

export const JOB_LEASE_MS = 120_000;
const JOB_TTL = 30 * 24 * 60 * 60;

/** Reserve the credit, create the recoverable job, and claim idempotency atomically. */
export async function createProcessingJob(job: Job, managed: boolean) {
  const result = await redis('EVAL', `
    local existing = redis.call('GET', KEYS[1])
    if existing then return existing end
    if ARGV[2] == '1' and tonumber(redis.call('GET', KEYS[3]) or '0') < 1 then return 'NO_CREDITS' end
    local job = cjson.decode(ARGV[1])
    job.credit_reserved = ARGV[2] == '1'
    job.credit_period = redis.call('GET', KEYS[4])
    if job.credit_reserved then redis.call('DECR', KEYS[3]) end
    redis.call('SET', KEYS[2], cjson.encode(job), 'EX', ${JOB_TTL})
    redis.call('SET', KEYS[1], cjson.encode(job.job_id), 'EX', 604800)
    redis.call('ZADD', KEYS[5], ARGV[3], job.job_id)
    return 'CREATED'
  `, 5, `idem:${job.site_id}:${job.idempotency_key}`, `job:${job.job_id}`,
  `credits:${job.site_id}`, `account-period:${job.site_id}`, `processing:${job.site_id}`,
  JSON.stringify(job), managed ? '1' : '0', Date.parse(job.created_at) + JOB_LEASE_MS);
  return result as string;
}

/** Exactly-once terminal transition, including refund and usage accounting. */
export async function settleJob(job: Job, retryable = false, staleBefore?: number): Promise<Job> {
  const result = await redis('EVAL', `
    local raw = redis.call('GET', KEYS[1])
    if not raw then return nil end
    local old = cjson.decode(raw)
    if old.status ~= 'processing' then return raw end
    if ARGV[3] ~= '' and old.created_at > ARGV[3] then return raw end
    local job = cjson.decode(ARGV[1])
    if job.status == 'failed' and old.credit_reserved and old.credit_period == redis.call('GET', KEYS[3]) then
      redis.call('INCR', KEYS[2])
    end
    if job.status == 'completed' and not old.credit_reserved then redis.call('INCR', KEYS[6]) end
    job.credit_reserved = false
    redis.call('SET', KEYS[1], cjson.encode(job), 'EX', ${JOB_TTL})
    redis.call('ZREM', KEYS[5], job.job_id)
    if ARGV[2] == '1' and redis.call('GET', KEYS[4]) == cjson.encode(job.job_id) then redis.call('DEL', KEYS[4]) end
    return cjson.encode(job)
  `, 6, `job:${job.job_id}`, `credits:${job.site_id}`, `account-period:${job.site_id}`,
  `idem:${job.site_id}:${job.idempotency_key}`, `processing:${job.site_id}`, `actions:${job.site_id}`,
  JSON.stringify(job), retryable ? '1' : '0', staleBefore === undefined ? '' : new Date(staleBefore).toISOString());
  if (!result) throw new Error('Job disappeared before completion');
  return JSON.parse(result);
}

export async function recoverStaleJob(job: Job, now = Date.now()): Promise<Job> {
  if (job.status !== 'processing' || Date.parse(job.created_at) > now - JOB_LEASE_MS) return job;
  return settleJob({ ...job, status: 'failed', credits_charged: 0,
    error: 'Processing was interrupted. Your reserved credit has been released; please run the analysis again.' }, true, now - JOB_LEASE_MS);
}

export async function recoverSiteJobs(site: Site) {
  const now = Date.now();
  // One bounded round trip, even when many interrupted jobs await recovery.
  await redis('EVAL', `
    local ids = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 20)
    for _, id in ipairs(ids) do
      local key = 'job:' .. id
      local raw = redis.call('GET', key)
      if not raw then
        redis.call('ZREM', KEYS[1], id)
      else
        local job = cjson.decode(raw)
        if job.site_id == ARGV[3] and job.status == 'processing' and job.created_at <= ARGV[2] then
          if job.credit_reserved and job.credit_period == redis.call('GET', KEYS[3]) then redis.call('INCR', KEYS[2]) end
          job.credit_reserved = false
          job.status = 'failed'
          job.credits_charged = 0
          job.error = 'Processing was interrupted. Your reserved credit has been released; please run the analysis again.'
          redis.call('SET', key, cjson.encode(job), 'EX', ${JOB_TTL})
          local idem = 'idem:' .. job.site_id .. ':' .. job.idempotency_key
          if redis.call('GET', idem) == cjson.encode(id) then redis.call('DEL', idem) end
        end
        if job.status ~= 'processing' then redis.call('ZREM', KEYS[1], id) end
      end
    end
    return #ids
  `, 3, `processing:${site.site_id}`, `credits:${site.site_id}`, `account-period:${site.site_id}`,
  now, new Date(now - JOB_LEASE_MS).toISOString(), site.site_id);
}
