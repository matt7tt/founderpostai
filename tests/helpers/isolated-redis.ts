import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
const exec = promisify(execFile);

/** Real Redis/Lua behind an Upstash-compatible local facade. Never loads project env files. */
export async function isolatedRedis() {
  const name = `founderpostai-test-${randomUUID()}`;
  await exec('docker', ['run', '--detach', '--name', name, 'redis:7-alpine', 'redis-server', '--save', '', '--appendonly', 'no']);
  const server = createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const command = JSON.parse(Buffer.concat(chunks).toString()).map(String);
      const { stdout } = await exec('docker', ['exec', name, 'redis-cli', '--json', ...command], { maxBuffer: 2 * 1024 * 1024 });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ result: JSON.parse(stdout) }));
    } catch (error) { res.statusCode = 500; res.end(JSON.stringify({ error: String(error) })); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed');
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${address.port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'isolated-test-only';
  return async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await exec('docker', ['rm', '--force', name]); // Only this disposable test container.
  };
}
