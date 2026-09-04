import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, getMonthlyPostCount, TIER_LIMITS } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const monthlyCount = getMonthlyPostCount(userId);
  const limit = TIER_LIMITS[user.tier];

  return res.status(200).json({
    tier: user.tier,
    monthlyCount,
    limit,
    stripeCustomerId: user.stripeCustomerId,
  });
}
