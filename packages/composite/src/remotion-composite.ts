import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { CompositeProvider, CompositeInput, CompositeResult, RunContext, CreativeBrief } from '@ektro-mv/core';
import { parseSrt, type Caption } from './srt.js';
import { mediaDurationSec } from './duration.js';

const FPS = 30;
const require = createRequire(import.meta.url);

export function resolveRemotionEntry(): string {
  return require.resolve('@ektro-mv/remotion/entry');
}

export interface ClipProp { src: string; clipDurationSec: number }

export interface RenderOptions {
  durationInFrames: number;
  outPath: string;
  inputProps: { clips: ClipProp[]; audioSrc: string; title: string; captions: Caption[] };
}

export interface RemotionCompositeOptions {
  probeDuration?: (path: string) => Promise<number>;
  readSrt?: (path: string) => Promise<string>;
  render?: (opts: RenderOptions) => Promise<void>;
  fps?: number;
}

export class RemotionCompositeProvider implements CompositeProvider {
  readonly name = 'remotion';
  private probeDuration: (path: string) => Promise<number>;
  private readSrt: (path: string) => Promise<string>;
  private doRender: (opts: RenderOptions) => Promise<void>;
  private fps: number;

  constructor(opts: RemotionCompositeOptions = {}) {
    this.probeDuration = opts.probeDuration ?? mediaDurationSec;
    this.readSrt = opts.readSrt ?? (async (p) => readFile(p, 'utf8'));
    this.doRender = opts.render ?? defaultRender;
    this.fps = opts.fps ?? FPS;
  }

  async render(brief: CreativeBrief, input: CompositeInput, ctx: RunContext): Promise<CompositeResult> {
    if (!input.clipPaths.length) throw new Error('composite: clipPaths must not be empty');
    const durationSec = await this.probeDuration(input.audioPath).catch(() => brief.song.durationSec);
    const captions = input.srtPath ? parseSrt(await this.readSrt(input.srtPath)) : [];
    const outPath = join(ctx.workDir, 'ektro-mv.mp4');
    const clips = await Promise.all(
      input.clipPaths.map(async (src) => ({ src, clipDurationSec: await this.probeDuration(src).catch(() => 10) })),
    );
    ctx.log(`remotion: rendering ${Math.round(durationSec)}s @ ${this.fps}fps from ${clips.length} clip(s)`);
    await this.doRender({
      durationInFrames: Math.max(1, Math.round(durationSec * this.fps)),
      outPath,
      inputProps: { clips, audioSrc: input.audioPath, title: brief.title, captions },
    });
    return { outputMp4: outPath };
  }
}

async function defaultRender(opts: RenderOptions): Promise<void> {
  const { dirname, resolve, basename } = await import('node:path');
  const { bundle } = await import('@remotion/bundler');
  const { selectComposition, renderMedia } = await import('@remotion/renderer');
  // OffthreadVideo cannot load file:// URLs — it needs http(s) or a staticFile served from
  // the bundle's publicDir. The pipeline writes the clip + song into the same workDir, so
  // serve that dir and reference the assets by basename (resolveUrl → staticFile()).
  const publicDir = dirname(resolve(opts.inputProps.audioSrc));
  const inputProps = {
    ...opts.inputProps,
    audioSrc: basename(opts.inputProps.audioSrc),
    clips: opts.inputProps.clips.map((c) => ({ ...c, src: basename(c.src) })),
  };
  // Resolve the separately published composition package instead of relying on
  // the monorepo's apps/ directory being present after npm installation.
  const entry = resolveRemotionEntry();
  // Use a system Chromium (Chrome/Edge) when provided, to skip Remotion's gated download.
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
  const serveUrl = await bundle({ entryPoint: entry, publicDir });
  const composition = await selectComposition({ serveUrl, id: 'MusicVideo', inputProps, browserExecutable });
  // Override durationInFrames so the CLI controls the output length (calculateMetadata is a studio preview fallback)
  const compositionWithDuration = { ...composition, durationInFrames: opts.durationInFrames };
  await renderMedia({
    serveUrl, composition: compositionWithDuration, codec: 'h264',
    // Programmatic renderMedia ignores remotion.config.ts — set delivery encoding here so the
    // output is broad-platform safe (limited-range yuv420p + BT.709), not full-range yuvj420p.
    pixelFormat: 'yuv420p', colorSpace: 'bt709',
    outputLocation: opts.outPath, inputProps, browserExecutable,
  });
}
