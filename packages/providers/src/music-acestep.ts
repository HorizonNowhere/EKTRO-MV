import { writeFile as fsWriteFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MusicProvider, MusicResult, RunContext, CreativeBrief } from '@ektro-mv/core';
import { ComfyUIClient, buildAceStepWorkflow } from './clients/comfyui.js';
import { mediaDurationSec } from './util/ffprobe.js';

export interface AceStepMusicOptions {
  client?: ComfyUIClient;
  baseUrl?: string;
  steps?: number;
  writeFile?: (path: string, data: Uint8Array) => Promise<void>;
  probeDuration?: (path: string) => Promise<number>;
}

interface ComfyAudioOut { filename: string; subfolder: string; type: string }

export class AceStepMusicProvider implements MusicProvider {
  readonly name = 'ace-step';
  private client: ComfyUIClient;
  private steps: number;
  private writeFile: (path: string, data: Uint8Array) => Promise<void>;
  private probeDuration: (path: string) => Promise<number>;

  constructor(opts: AceStepMusicOptions = {}) {
    this.client = opts.client ?? new ComfyUIClient({ baseUrl: opts.baseUrl });
    this.steps = opts.steps ?? 50;
    this.writeFile = opts.writeFile ?? (async (p, d) => { await fsWriteFile(p, d); });
    this.probeDuration = opts.probeDuration ?? mediaDurationSec;
  }

  async generate(brief: CreativeBrief, ctx: RunContext): Promise<MusicResult> {
    const workflow = buildAceStepWorkflow({
      tags: brief.song.tags,
      lyrics: brief.song.lyrics,
      durationSec: brief.song.durationSec,
      steps: this.steps,
    });
    ctx.log(`ace-step: queueing song (${brief.song.durationSec}s)`);
    const { prompt_id } = await this.client.queuePrompt(workflow);
    const hist = await this.client.waitPrompt(prompt_id);
    const audio = findAudioOutput(hist);
    if (!audio) throw new Error('ace-step: no audio output in ComfyUI history');
    const buf = await this.client.downloadOutput(audio.filename, audio.subfolder, audio.type);
    const dest = join(ctx.workDir, audio.filename.endsWith('.flac') ? audio.filename : 'song.flac');
    await this.writeFile(dest, new Uint8Array(buf));
    const durationSec = await this.probeDuration(dest).catch(() => brief.song.durationSec);
    return { audioPath: dest, durationSec };
  }
}

function findAudioOutput(hist: { outputs?: Record<string, { audio?: ComfyAudioOut[] }> }): ComfyAudioOut | undefined {
  for (const node of Object.values(hist.outputs ?? {})) {
    if (node.audio && node.audio.length > 0) return node.audio[0];
  }
  return undefined;
}
