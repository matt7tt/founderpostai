/**
 * In-memory database for Vercel serverless deployment.
 * Data persists per serverless instance (resets on cold start).
 * For production with persistence, replace with Vercel Postgres or similar.
 */

export interface User {
  id: string;
  email: string;
  password: string;
  tier: 'free' | 'pro';
  createdAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  topic: string;
  tone: string;
  postType: string;
  length: string;
  createdAt: string;
}

export interface SubscriptionEvent {
  id: string;
  userId: string;
  eventType: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

export const TIER_LIMITS: Record<User['tier'], number> = {
  free: 2,
  pro: 50,
};

// In-memory stores
const users: Map<string, User> = new Map();
const posts: Post[] = [];
const subscriptionEvents: SubscriptionEvent[] = [];

let userIdCounter = 1;
let postIdCounter = 1;
let eventIdCounter = 1;

// User operations
export function createUser(email: string, hashedPassword: string): User {
  const id = (userIdCounter++).toString();
  const user: User = {
    id,
    email: email.toLowerCase(),
    password: hashedPassword,
    tier: 'free',
    createdAt: new Date().toISOString(),
  };
  users.set(id, user);
  return user;
}

export function getUserByEmail(email: string): User | undefined {
  const lowerEmail = email.toLowerCase();
  for (const user of users.values()) {
    if (user.email === lowerEmail) return user;
  }
  return undefined;
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function updateUserTier(userId: string, tier: 'free' | 'pro'): void {
  const user = users.get(userId);
  if (user) {
    user.tier = tier;
    users.set(userId, user);
  }
}

export function updateUserByEmail(email: string, updates: Partial<User>): void {
  const lowerEmail = email.toLowerCase();
  for (const [id, user] of users.entries()) {
    if (user.email === lowerEmail) {
      users.set(id, { ...user, ...updates });
      return;
    }
  }
}

export function updateUser(userId: string, updates: Partial<User>): User | undefined {
  const user = users.get(userId);
  if (!user) return undefined;

  const updatedUser = { ...user, ...updates, id: user.id };
  users.set(userId, updatedUser);
  return updatedUser;
}

export function getUserByStripeCustomerId(customerId: string): User | undefined {
  for (const user of users.values()) {
    if (user.stripeCustomerId === customerId) return user;
  }
  return undefined;
}

// Post operations
export function createPost(
  userId: string,
  content: string,
  topic: string,
  tone: string,
  postType: string,
  length: string
): Post {
  const post: Post = {
    id: (postIdCounter++).toString(),
    userId,
    content,
    topic,
    tone,
    postType,
    length,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  return post;
}

export function getPostsByUserId(userId: string, limit = 100): Post[] {
  return posts
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getMonthlyPostCount(userId: string): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return posts.filter(
    (p) => p.userId === userId && new Date(p.createdAt) >= monthStart
  ).length;
}

// Subscription event operations
export function createSubscriptionEvent(
  userId: string,
  eventType: string,
  stripeSubscriptionId?: string
): SubscriptionEvent {
  const event: SubscriptionEvent = {
    id: (eventIdCounter++).toString(),
    userId,
    eventType,
    stripeSubscriptionId,
    createdAt: new Date().toISOString(),
  };
  subscriptionEvents.push(event);
  return event;
}
