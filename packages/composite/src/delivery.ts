import { spawn } from 'node:child_process';

export interface FfprobeStream { codec_type: string; codec_name?: string; pix_fmt?: string }
export interface FfprobeJson { streams: FfprobeStream[]; format?: { format_name?: string } }

export function assertDeliveryCompliant(probe: FfprobeJson): void {
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  if (!video) throw new Error('delivery: no video stream');
  if (video.codec_name !== 'h264') throw new Error(`delivery: video codec must be h264, got ${video.codec_name}`);
  if (video.pix_fmt !== 'yuv420p') throw new Error(`delivery: pix_fmt must be yuv420p, got ${video.pix_fmt}`);
  if (!audio) throw new Error('delivery: no audio stream');
  if (audio.codec_name !== 'aac') throw new Error(`delivery: audio codec must be aac, got ${audio.codec_name}`);
}

export function ffprobeJson(filePath: string, probePath = process.env.FFPROBE_PATH || 'ffprobe'): Promise<FfprobeJson> {
  return new Promise((resolve, reject) => {
    const p = spawn(probePath, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath]);
    let out = ''; let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe failed (${code}): ${err}`));
      try { resolve(JSON.parse(out) as FfprobeJson); } catch (e) { reject(new Error(`ffprobe: bad json (${(e as Error).message})`)); }
    });
  });
}
