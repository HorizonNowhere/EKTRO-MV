export { SeedanceVideoProvider } from './video-seedance.js';
export { AceStepMusicProvider } from './music-acestep.js';
export { WhisperSubtitleProvider } from './subtitle-whisper.js';
export { mediaDurationSec } from './util/ffprobe.js';

import { SeedanceVideoProvider } from './video-seedance.js';
import { AceStepMusicProvider } from './music-acestep.js';
import { WhisperSubtitleProvider } from './subtitle-whisper.js';
import type { MusicProvider, VideoProvider, SubtitleProvider } from '@ektro-mv/core';

export interface MediaProviderConfig {
  seedanceApiKey?: string;
  seedanceBaseUrl?: string;
  comfyBaseUrl?: string;
  whisperInstallDir?: string;
}

export function defaultMediaProviders(cfg: MediaProviderConfig): {
  music: MusicProvider; video: VideoProvider; subtitle: SubtitleProvider;
} {
  return {
    music: new AceStepMusicProvider({ baseUrl: cfg.comfyBaseUrl }),
    video: new SeedanceVideoProvider({ apiKey: cfg.seedanceApiKey, baseUrl: cfg.seedanceBaseUrl }),
    subtitle: new WhisperSubtitleProvider({ installDir: cfg.whisperInstallDir }),
  };
}
