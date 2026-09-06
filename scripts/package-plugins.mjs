import { mkdtemp, mkdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'founderpostai-packages-'));
try {
  for (const [slug, destination] of [
    ['aisuite-seo', 'public/downloads/aisuite-seo.zip'],
    ['aisuite-seo-pro', 'private/downloads/aisuite-seo-pro.zip'],
  ]) {
    const archive = path.join(temp, `${slug}.zip`);
    await exec('zip', ['-q', '-r', archive, slug, '-x', '*/.DS_Store', '*/__MACOSX/*'], { cwd: path.join(root, 'wp-plugins') });
    await exec('unzip', ['-t', archive]);
    const output = path.join(root, destination);
    await mkdir(path.dirname(output), { recursive: true });
    await rename(archive, output);
    console.log(`Packaged ${slug} → ${destination}`);
  }
} finally { await rm(temp, { recursive: true, force: true }); }
