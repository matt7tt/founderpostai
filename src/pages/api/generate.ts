import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePostVariations } from '@/lib/claude';
import { getUserById, getMonthlyPostCount, createPost, TIER_LIMITS } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

  if (monthlyCount >= limit) {
    return res.status(429).json({
      error: user.tier === 'free'
        ? `You've used all ${limit} free posts this month. Upgrade to Pro for 50 posts/month.`
        : `You've reached your monthly limit of ${limit} posts.`,
      limitReached: true,
    });
  }

  const { topic, tone, postType, length } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    return res.status(400).json({ error: 'Topic must be at least 3 characters' });
  }

  const validTones = ['professional', 'casual', 'funny', 'thought-leadership'];
  const validTypes = ['story', 'tips', 'questions', 'announcement', 'insight'];
  const validLengths = ['short', 'medium', 'long'];

  if (!validTones.includes(tone)) {
    return res.status(400).json({ error: 'Invalid tone' });
  }
  if (!validTypes.includes(postType)) {
    return res.status(400).json({ error: 'Invalid post type' });
  }
  if (!validLengths.includes(length)) {
    return res.status(400).json({ error: 'Invalid length' });
  }

  try {
    const variations = await generatePostVariations(topic.trim(), tone, postType, length);

    // Save first variation as the representative post
    createPost(userId, variations[0], topic.trim(), tone, postType, length);

    return res.status(200).json({ variations });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: 'Failed to generate posts. Please try again.' });
  }
}
