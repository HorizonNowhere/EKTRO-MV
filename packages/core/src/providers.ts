import type { CreativeBrief } from './brief.js';

export interface RunContext {
  workDir: string;
  log: (msg: string, extra?: unknown) => void;
}

export interface Step<State> {
  name: string;
  run: (ctx: RunContext & { state: State }) => Promise<void> | void;
  skip?: (ctx: RunContext & { state: State }) => boolean;
}

export interface MusicResult { audioPath: string; durationSec: number }
export interface VideoResult { clipPaths: string[] }
export interface SubtitleResult { srtPath: string }
export interface CompositeInput { audioPath: string; clipPaths: string[]; srtPath?: string }
export interface CompositeResult { outputMp4: string }

export interface BrainProvider {
  name: string;
  compose(oneLiner: string): Promise<CreativeBrief>;
}
export interface MusicProvider {
  name: string;
  generate(brief: CreativeBrief, ctx: RunContext): Promise<MusicResult>;
}
export interface VideoProvider {
  name: string;
  generate(brief: CreativeBrief, ctx: RunContext): Promise<VideoResult>;
}
export interface SubtitleProvider {
  name: string;
  align(audioPath: string, brief: CreativeBrief, ctx: RunContext): Promise<SubtitleResult>;
}
export interface CompositeProvider {
  name: string;
  render(brief: CreativeBrief, input: CompositeInput, ctx: RunContext): Promise<CompositeResult>;
}
