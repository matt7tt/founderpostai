import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getMonthlyPostCount, TIER_LIMITS } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentCount = getMonthlyPostCount(user.id);
    const limit = TIER_LIMITS[user.tier];

    return res.status(200).json({
      tier: user.tier,
      used: currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
    });
  } catch (error) {
    console.error('Usage error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
