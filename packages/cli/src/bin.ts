#!/usr/bin/env node
import { resolve } from 'node:path';
import { loadConfig, AnthropicBrainProvider } from '@ektro-mv/core';
import { defaultMediaProviders } from '@ektro-mv/providers';
import { RemotionCompositeProvider } from '@ektro-mv/composite';
import { runMv } from './run.js';
import { parseArgs } from './args.js';

const HELP = `ektro-mv — one sentence → a music video

Usage:
  ektro-mv "<one sentence>" [--out file.mp4] [--workdir ./dir]

Env (see .env.example): ANTHROPIC_API_KEY, ARK_API_KEY, COMFYUI_URL, EKTRO_WHISPER_INSTALL_DIR`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.oneLiner) { console.log(HELP); process.exit(args.help ? 0 : 1); }

  const cfg = loadConfig();
  const brain = new AnthropicBrainProvider({ apiKey: cfg.brain.apiKey, baseURL: cfg.brain.baseURL, model: cfg.brain.model });
  const media = defaultMediaProviders({
    seedanceApiKey: process.env.ARK_API_KEY,
    seedanceBaseUrl: process.env.ARK_BASE_URL,
    comfyBaseUrl: process.env.COMFYUI_URL,
    whisperInstallDir: process.env.EKTRO_WHISPER_INSTALL_DIR,
  });
  const composite = new RemotionCompositeProvider();
  const workDir = resolve(args.workDir ?? `./ektro-out/${Date.now()}`);

  const { outputMp4 } = await runMv(args.oneLiner, { workDir, brain, music: media.music, video: media.video, subtitle: media.subtitle, composite });

  const { ffprobeJson, assertDeliveryCompliant } = await import('@ektro-mv/composite');
  try {
    assertDeliveryCompliant(await ffprobeJson(outputMp4));
    console.log('✓ delivery-compliant (h264/yuv420p/aac)');
  } catch (e) {
    console.warn(`⚠️  delivery check: ${(e as Error).message}`);
  }

  if (args.out) {
    const { rename } = await import('node:fs/promises');
    const dest = resolve(args.out);
    await rename(outputMp4, dest);
    console.log(`\n✅ ${dest}`);
  } else {
    console.log(`\n✅ ${outputMp4}`);
  }
}

main().catch((e) => { console.error(`\n❌ ${(e as Error).message}`); process.exit(1); });
