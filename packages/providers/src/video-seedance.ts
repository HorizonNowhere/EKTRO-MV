import { join } from 'node:path';
import type { VideoProvider, VideoResult, RunContext, CreativeBrief } from '@ektro-mv/core';
import { SeedanceClient, downloadVideo, SEEDANCE_FAST_MODEL, type GenerateVideoInput } from './clients/seedance.js';

export interface SeedanceVideoOptions {
  client?: SeedanceClient;
  apiKey?: string;
  baseUrl?: string;
  /** Use the faster Seedance model. Defaults to true for cheap v1 runs. */
  fast?: boolean;
  download?: (url: string, destPath: string) => Promise<string>;
}

export class SeedanceVideoProvider implements VideoProvider {
  readonly name = 'seedance';
  private client: SeedanceClient;
  private download: (url: string, destPath: string) => Promise<string>;
  private fast: boolean;

  constructor(opts: SeedanceVideoOptions = {}) {
    this.client = opts.client ?? new SeedanceClient({
      apiKey: opts.apiKey ?? process.env.ARK_API_KEY ?? '',
      baseUrl: opts.baseUrl,
    });
    this.download = opts.download ?? downloadVideo;
    this.fast = opts.fast ?? true;
  }

  async generate(brief: CreativeBrief, ctx: RunContext): Promise<VideoResult> {
    const shots = brief.video.shots ?? [brief.video.prompt];
    const clipPaths: string[] = [];
    for (let i = 0; i < shots.length; i++) {
      const input: GenerateVideoInput = {
        prompt: shots[i],
        model: this.fast ? SEEDANCE_FAST_MODEL : undefined,
        options: { ratio: brief.video.ratio, resolution: brief.video.resolution, duration: 10 },
      };
      ctx.log(`seedance: generating shot ${i + 1}/${shots.length} (${brief.video.ratio} ${brief.video.resolution})`);
      const task = await this.client.generateVideo(input);
      const url = task.content?.video_url;
      if (!url) throw new Error(`seedance: shot ${i + 1} task ${task.id} produced no video_url (status=${task.status})`);
      const dest = join(ctx.workDir, `clip-${i}.mp4`);
      await this.download(url, dest);
      clipPaths.push(dest);
    }
    return { clipPaths };
  }
}
