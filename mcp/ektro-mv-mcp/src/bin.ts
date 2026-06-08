#!/usr/bin/env node
import { resolve } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, AnthropicBrainProvider } from '@ektro-mv/core';
import { defaultMediaProviders } from '@ektro-mv/providers';
import { RemotionCompositeProvider } from '@ektro-mv/composite';
import { runMv } from '@ektro-mv/cli';
import { createEktroMvServer } from './server.js';

async function main() {
  const server = createEktroMvServer({
    run: async (oneLiner, workDir) => {
      const cfg = loadConfig();
      const brain = new AnthropicBrainProvider({ apiKey: cfg.brain.apiKey, baseURL: cfg.brain.baseURL, model: cfg.brain.model });
      const media = defaultMediaProviders({
        seedanceApiKey: process.env.ARK_API_KEY,
        seedanceBaseUrl: process.env.ARK_BASE_URL,
        comfyBaseUrl: process.env.COMFYUI_URL,
        whisperInstallDir: process.env.EKTRO_WHISPER_INSTALL_DIR,
      });
      const dir = resolve(workDir ?? `./ektro-out/${Date.now()}`);
      const { outputMp4, brief } = await runMv(oneLiner, { workDir: dir, brain, music: media.music, video: media.video, subtitle: media.subtitle, composite: new RemotionCompositeProvider() });
      return { outputMp4, briefTitle: brief.title };
    },
  });
  await server.connect(new StdioServerTransport());
}

main().catch((e) => { console.error(`ektro-mv-mcp fatal: ${(e as Error).message}`); process.exit(1); });
