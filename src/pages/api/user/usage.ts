import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getMonthlyPostCount, TIER_LIMITS } from '@/lib/db';

type ResponseData = {
  tier?: string;
  posts_used?: number;
  posts_limit?: number;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = getUserByEmail(session.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const postsUsed = getMonthlyPostCount(user.id);
    const limit = TIER_LIMITS[user.tier];

    return res.status(200).json({
      tier: user.tier,
      posts_used: postsUsed,
      posts_limit: limit,
    });
  } catch (error) {
    console.error('Usage error:', error);
    return res.status(500).json({ message: 'Failed to fetch usage' });
  }
}
