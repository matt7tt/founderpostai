import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getPostsByUserId } from '@/lib/db';

type ResponseData = {
  posts?: Array<{
    id: string;
    content: string;
    topic: string;
    tone: string;
    post_type: string;
    length: string;
    created_at: string;
  }>;
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

    const userPosts = getPostsByUserId(user.id);

    // Map to expected format for frontend
    const posts = userPosts.map((p) => ({
      id: p.id,
      content: p.content,
      topic: p.topic,
      tone: p.tone,
      post_type: p.postType,
      length: p.length,
      created_at: p.createdAt,
    }));

    return res.status(200).json({ posts });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ message: 'Failed to fetch history' });
  }
}
