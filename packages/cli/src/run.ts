import { mkdir } from 'node:fs/promises';
import type {
  BrainProvider, MusicProvider, VideoProvider, SubtitleProvider, CompositeProvider,
  RunContext, CreativeBrief,
} from '@ektro-mv/core';

export interface RunMvDeps {
  workDir: string;
  brain: BrainProvider;
  music: MusicProvider;
  video: VideoProvider;
  subtitle: SubtitleProvider;
  composite: CompositeProvider;
  log?: (msg: string, extra?: unknown) => void;
}

export interface RunMvResult { brief: CreativeBrief; outputMp4: string }

export async function runMv(oneLiner: string, deps: RunMvDeps): Promise<RunMvResult> {
  const log = deps.log ?? ((m: string) => console.log(`[ektro-mv] ${m}`));
  const ctx: RunContext = { workDir: deps.workDir, log };
  await mkdir(deps.workDir, { recursive: true });

  log('composing creative brief…');
  const brief = await deps.brain.compose(oneLiner);
  log(`brief: "${brief.title}" (${brief.style})`);

  const music = await deps.music.generate(brief, ctx);
  const video = await deps.video.generate(brief, ctx);
  const subtitle = await deps.subtitle.align(music.audioPath, brief, ctx);
  const composite = await deps.composite.render(
    brief, { audioPath: music.audioPath, clipPaths: video.clipPaths, srtPath: subtitle.srtPath }, ctx,
  );
  log(`done → ${composite.outputMp4}`);
  return { brief, outputMp4: composite.outputMp4 };
}
