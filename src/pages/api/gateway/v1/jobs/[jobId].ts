import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob, authedSite, accountFor } from '@/lib/gateway/store';
import { recoverStaleJob } from '@/lib/gateway/job-lifecycle';

export const config = { api: { bodyParser: false } };

// GET /v1/jobs/{job_id} — polling fallback, same shape as the callback body.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const site = await authedSite(req, res, '');
  if (!site) return;

  let job = await getJob(req.query.jobId as string);
  if (!job || job.site_id !== site.site_id) {
    return res.status(404).json({ error: 'Job not found' });
  }
  job = await recoverStaleJob(job);

  return res.status(200).json({
    idempotency_key: job.idempotency_key,
    job_id: job.job_id,
    type: job.type,
    status: job.status,
    credits_charged: job.credits_charged,
    result: job.result,
    error: job.error,
    account: await accountFor(site),
  });
}
