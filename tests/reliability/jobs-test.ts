import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isolatedRedis } from '../helpers/isolated-redis';
import type { Job } from '../../src/lib/gateway/store';

test('atomic credit reservations, concurrency, terminal races and interrupted job recovery', async () => {
  const close = await isolatedRedis();
  try {
    const { redis, getJSON } = await import('../../src/lib/gateway/redis');
    const { createProcessingJob, settleJob, recoverStaleJob, recoverSiteJobs } = await import('../../src/lib/gateway/job-lifecycle');
    const job = (id: number): Job => ({ job_id: `job_${id}`, site_id: 'test_site', type: 'seo.analyze_post', status: 'processing', idempotency_key: `idem_${id}`, callback_url: 'https://test.example/callback', credits_charged: 0, created_at: new Date(Date.now() - 180000).toISOString() });
    await redis('SET', 'credits:test_site', 3);
    await redis('SET', 'account-period:test_site', '2026-09');
    const first = job(1);
    const duplicate = await Promise.all(Array.from({ length: 12 }, () => createProcessingJob(first, true)));
    assert.equal(duplicate.filter(value => value === 'CREATED').length, 1);
    assert.equal(await redis('GET', 'credits:test_site'), '2');
    const recovered = await Promise.all(Array.from({ length: 8 }, () => recoverStaleJob(first)));
    assert.ok(recovered.every(item => item.status === 'failed'));
    assert.equal(await redis('GET', 'credits:test_site'), '3', 'Concurrent recovery refunds exactly once');
    assert.equal(await redis('GET', 'idem:test_site:idem_1'), null);
    await settleJob({ ...first, status: 'completed', result: { suggestions: [] }, credits_charged: 1 });
    assert.equal((await getJSON<Job>('job:job_1'))?.status, 'failed', 'Late completion cannot overwrite recovered job');
    const reservations = await Promise.all(Array.from({ length: 10 }, (_, i) => createProcessingJob(job(i + 2), true)));
    assert.equal(reservations.filter(value => value === 'CREATED').length, 3);
    assert.equal(await redis('GET', 'credits:test_site'), '0');
    await recoverSiteJobs({ site_id: 'test_site' } as any);
    assert.equal(await redis('GET', 'credits:test_site'), '3', 'New submissions can reclaim stranded site credits');
    const rollover = job(50);
    await createProcessingJob(rollover, true);
    await redis('SET', 'account-period:test_site', '2026-10');
    await redis('SET', 'credits:test_site', 400);
    await recoverStaleJob(rollover);
    assert.equal(await redis('GET', 'credits:test_site'), '400', 'Old-period refunds cannot inflate the new allowance');
    const byok = job(51);
    await createProcessingJob(byok, false);
    await Promise.all(Array.from({ length: 6 }, () => settleJob({ ...byok, status: 'completed', credits_charged: 1, result: {} })));
    assert.equal(await redis('GET', 'actions:test_site'), '1', 'BYOK usage counted once');
    assert.equal(await redis('GET', 'credits:test_site'), '400');
    const fresh = { ...job(52), created_at: new Date().toISOString() };
    await createProcessingJob(fresh, true);
    assert.equal((await recoverStaleJob(fresh)).status, 'processing');
    await settleJob({ ...fresh, status: 'failed', error: 'Provider unavailable' }, true);
    assert.equal(await redis('GET', 'credits:test_site'), '400');
  } finally { await close(); }
});
