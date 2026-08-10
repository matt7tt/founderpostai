import type { NextApiRequest } from 'next';

/** Read a small signed gateway body without letting authenticated clients buffer unbounded input. */
export async function readGatewayBody(req: NextApiRequest, maxBytes = 16 * 1024): Promise<string> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) {
      const error: any = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
