// Minimal Upstash Redis REST client (no SDK — works in any serverless env)
const URL = process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export async function redis(...args: (string | number)[]): Promise<any> {
  if (!URL || !TOKEN) throw new Error('Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN)');
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const d = await r.json();
  if (d.error) throw new Error(`Redis: ${d.error}`);
  return d.result;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const v = await redis('GET', key);
  return v ? JSON.parse(v) : null;
}

export async function setJSON(key: string, value: any, exSeconds?: number): Promise<void> {
  if (exSeconds) {
    await redis('SET', key, JSON.stringify(value), 'EX', exSeconds);
  } else {
    await redis('SET', key, JSON.stringify(value));
  }
}
