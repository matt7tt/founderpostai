import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { createBillingPortalSession } from '@/lib/stripe';

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
  if (!user || !user.stripeCustomerId) {
    return res.status(400).json({ error: 'No billing account found' });
  }

  try {
    const url = await createBillingPortalSession(user.stripeCustomerId);
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: 'Failed to open billing portal' });
  }
}
