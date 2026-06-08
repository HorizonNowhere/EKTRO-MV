import { describe, it, expect } from 'vitest';
import type {
  BrainProvider, MusicProvider, VideoProvider,
  SubtitleProvider, CompositeProvider, RunContext,
} from '../src/providers.js';
import type { CreativeBrief } from '../src/brief.js';

const brief: CreativeBrief = {
  title: 'X', style: 'y', language: 'zh',
  song: { tags: 't', lyrics: 'l', durationSec: 120 },
  video: { prompt: 'p', ratio: '9:16', resolution: '480p' },
};
const ctx: RunContext = { workDir: '/tmp', log: () => {} };

describe('provider interfaces', () => {
  it('a fake brain conforms', async () => {
    const fake: BrainProvider = { name: 'fake', compose: async () => brief };
    expect((await fake.compose('hi')).title).toBe('X');
  });

  it('a fake media chain conforms', async () => {
    const music: MusicProvider = { name: 'm', generate: async () => ({ audioPath: '/a.flac', durationSec: 120 }) };
    const video: VideoProvider = { name: 'v', generate: async () => ({ clipPaths: ['/c.mp4'] }) };
    const subs: SubtitleProvider = { name: 's', align: async () => ({ srtPath: '/s.srt' }) };
    const comp: CompositeProvider = { name: 'c', render: async () => ({ outputMp4: '/out.mp4' }) };
    expect((await music.generate(brief, ctx)).durationSec).toBe(120);
    expect((await video.generate(brief, ctx)).clipPaths[0]).toBe('/c.mp4');
    expect((await subs.align('/a.flac', brief, ctx)).srtPath).toBe('/s.srt');
    expect((await comp.render(brief, { audioPath: '/a.flac', clipPaths: ['/c.mp4'], srtPath: '/s.srt' }, ctx)).outputMp4).toBe('/out.mp4');
  });
});
