import { randomUUID } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  AnthropicBrainProvider,
  StaticBrainProvider,
  loadConfig,
  redactSecrets,
} from '@ektro-mv/core';
import { defaultMediaProviders } from '@ektro-mv/providers';
import { RemotionCompositeProvider } from '@ektro-mv/composite';
import { runMv } from '@ektro-mv/cli';
import type { CreateDeps, DoctorDeps, DoctorInput } from './handler.js';
import { runPreflight, type PreflightDeps } from './preflight.js';

export class McpRuntimeError extends Error {
  constructor(readonly errorCode: string, message: string) {
    super(message);
    this.name = 'McpRuntimeError';
  }
}

type RunMv = typeof runMv;

export interface RuntimeDeps {
  env?: NodeJS.ProcessEnv;
  runMvImpl?: RunMv;
  preflight?: (input: DoctorInput, deps?: PreflightDeps) => ReturnType<typeof runPreflight>;
  randomId?: () => string;
  stderr?: (line: string) => void;
}

export function createRuntime(deps: RuntimeDeps = {}): CreateDeps & DoctorDeps {
  const env = deps.env ?? process.env;
  const runMvImpl = deps.runMvImpl ?? runMv;
  const preflight = deps.preflight ?? runPreflight;
  const randomId = deps.randomId ?? randomUUID;
  const stderr = deps.stderr ?? ((line: string) => process.stderr.write(`${line}\n`));
  let generationInProgress = false;

  return {
    doctor: async (input) => preflight(input, { env }),
    run: async (input) => {
      if (generationInProgress) {
        throw new McpRuntimeError(
          'generation_in_progress',
          'Another EKTRO-MV generation is already running. Wait for it to finish before starting a paid run.',
        );
      }
      generationInProgress = true;
      try {
        const readiness = await preflight({
          useBrief: Boolean(input.brief),
          includeSubtitles: !input.skipSubtitles,
        }, { env });
        if (!readiness.ok) {
          const failed = readiness.checks.filter((row) => row.required && !row.ok).map((row) => row.name);
          throw new McpRuntimeError('preflight_failed', `Missing or unavailable prerequisites: ${failed.join(', ')}`);
        }

        const runId = randomId();
        const workDir = resolveWorkDir(env.EKTRO_MV_OUTPUT_ROOT, input.outputDir, runId);
        const brain = input.brief
          ? new StaticBrainProvider(input.brief)
          : createAnthropicBrain(env);
        const media = defaultMediaProviders({
          seedanceApiKey: env.ARK_API_KEY,
          seedanceBaseUrl: env.ARK_BASE_URL,
          comfyBaseUrl: env.COMFYUI_URL,
          whisperInstallDir: env.EKTRO_WHISPER_INSTALL_DIR || env.HERMES_WHISPER_INSTALL_DIR,
        });

        try {
          const { outputMp4, brief } = await runMvImpl(input.prompt || '(from structured brief)', {
            workDir,
            brain,
            music: media.music,
            video: media.video,
            subtitle: input.skipSubtitles ? undefined : media.subtitle,
            composite: new RemotionCompositeProvider(),
            // stdout is reserved exclusively for MCP JSON-RPC frames.
            log: (message) => stderr(`[ektro-mv:${runId}] ${message}`),
          });
          return {
            runId,
            outputMp4,
            briefTitle: brief.title,
            workDir,
            subtitles: !input.skipSubtitles,
          };
        } catch (error) {
          throw new McpRuntimeError('generation_failed', redactSecrets(errorMessage(error), {
            secrets: [env.ANTHROPIC_API_KEY, env.ARK_API_KEY, env.EKTRO_MV_MCP_TOKEN],
          }));
        }
      } finally {
        generationInProgress = false;
      }
    },
  };
}

function createAnthropicBrain(env: NodeJS.ProcessEnv): AnthropicBrainProvider {
  const cfg = loadConfig(env);
  return new AnthropicBrainProvider({
    apiKey: cfg.brain.apiKey,
    baseURL: cfg.brain.baseURL,
    model: cfg.brain.model,
  });
}

export function resolveWorkDir(outputRoot: string | undefined, outputDir: string | undefined, runId: string): string {
  const root = resolve(outputRoot || './ektro-out');
  if (!outputDir) return resolve(root, runId);
  if (isAbsolute(outputDir)) {
    throw new McpRuntimeError('invalid_output_dir', 'outputDir must be relative to EKTRO_MV_OUTPUT_ROOT');
  }
  const candidate = resolve(root, outputDir);
  const fromRoot = relative(root, candidate);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) {
    throw new McpRuntimeError('invalid_output_dir', 'outputDir escapes EKTRO_MV_OUTPUT_ROOT');
  }
  return resolve(candidate, runId);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'EKTRO-MV generation failed';
}
