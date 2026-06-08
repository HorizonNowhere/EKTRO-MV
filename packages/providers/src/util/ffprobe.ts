import { spawn } from 'node:child_process';

export function ffprobePath(): string {
  return process.env.FFPROBE_PATH || 'ffprobe';
}

export async function mediaDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', filePath];
    const p = spawn(ffprobePath(), args);
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe failed (${code}): ${err}`));
      const sec = Number.parseFloat(out.trim());
      if (Number.isNaN(sec)) return reject(new Error(`ffprobe: unparseable duration: ${out}`));
      resolve(sec);
    });
  });
}
