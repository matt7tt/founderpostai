import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, createPost, getMonthlyPostCount, TIER_LIMITS } from '@/lib/db';
import { generatePostVariations } from '@/lib/claude';

type ResponseData = {
  message?: string;
  posts?: string[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { topic, tone, postType, length } = req.body;

  if (!topic || !tone || !postType || !length) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = getUserByEmail(session.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const monthlyCount = getMonthlyPostCount(user.id);
    const limit = TIER_LIMITS[user.tier];

    if (monthlyCount >= limit) {
      return res.status(403).json({
        error: `You've reached your monthly limit of ${limit} post generation${limit === 1 ? '' : 's'}. Upgrade to Pro for 50/month.`,
      });
    }

    const generatedPosts = await generatePostVariations(topic, tone, postType, length);

    // Save each generated post to history
    generatedPosts.forEach((content) => {
      createPost(user.id, content, topic, tone, postType, length);
    });

    return res.status(200).json({ posts: generatedPosts });
  } catch (error) {
    console.error('Generate posts error:', error);
    return res.status(500).json({ message: 'Failed to generate posts. Please try again.' });
  }
}
