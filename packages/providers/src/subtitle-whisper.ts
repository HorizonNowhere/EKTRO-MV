import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SubtitleProvider, SubtitleResult, RunContext, CreativeBrief } from '@ektro-mv/core';
import {
  ensureWhisper, toMonoWav16k, transcribeToSrt,
  type WhisperConfig, type WhisperModel, type SrtCaption, type TranscribeOptions,
} from './clients/whisper.js';

export interface WhisperSubtitleOptions {
  installDir?: string;
  model?: WhisperModel;
  ensure?: (cfg: WhisperConfig) => Promise<void>;
  toWav?: (input: string, output: string) => Promise<string>;
  transcribe?: (cfg: WhisperConfig, opts: TranscribeOptions & { srtPath: string }) => Promise<SrtCaption[]>;
}

export class WhisperSubtitleProvider implements SubtitleProvider {
  readonly name = 'whisper';
  private cfg: WhisperConfig;
  private ensure: (cfg: WhisperConfig) => Promise<void>;
  private toWav: (input: string, output: string) => Promise<string>;
  private transcribe: (cfg: WhisperConfig, opts: TranscribeOptions & { srtPath: string }) => Promise<SrtCaption[]>;

  constructor(opts: WhisperSubtitleOptions = {}) {
    this.cfg = {
      installDir: opts.installDir
        ?? process.env.EKTRO_WHISPER_INSTALL_DIR
        ?? process.env.HERMES_WHISPER_INSTALL_DIR
        ?? join(homedir(), '.ektro-whisper'),
      model: opts.model
        ?? (process.env.EKTRO_WHISPER_MODEL as WhisperModel | undefined)
        ?? (process.env.HERMES_WHISPER_MODEL as WhisperModel | undefined)
        ?? 'base',
    };
    this.ensure = opts.ensure ?? ensureWhisper;
    this.toWav = opts.toWav ?? toMonoWav16k;
    this.transcribe = opts.transcribe ?? transcribeToSrt;
  }

  async align(audioPath: string, brief: CreativeBrief, ctx: RunContext): Promise<SubtitleResult> {
    ctx.log('whisper: ensuring model');
    await this.ensure(this.cfg);
    const wav = join(ctx.workDir, 'audio-16k.wav');
    await this.toWav(audioPath, wav);
    const srtPath = join(ctx.workDir, 'subtitles.srt');
    ctx.log('whisper: transcribing');
    await this.transcribe(this.cfg, { audioPath: wav, language: brief.language, srtPath });
    return { srtPath };
  }
}
