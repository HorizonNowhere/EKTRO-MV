import { access } from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { sanitizeUrlForLogs } from '@ektro-mv/core';
import type { DoctorInput, DoctorOutput } from './handler.js';
import { PROJECT_URL } from './handler.js';

const execFile = promisify(execFileCallback);
const require = createRequire(import.meta.url);

export interface PreflightCheck {
  name: string;
  ok: boolean;
  required: boolean;
  message: string;
}

export interface PreflightDeps {
  env?: NodeJS.ProcessEnv;
  nodeVersion?: string;
  commandAvailable?: (command: string) => Promise<boolean>;
  urlAvailable?: (url: string) => Promise<boolean>;
  pathAvailable?: (path: string) => Promise<boolean>;
  packageAvailable?: (name: string) => boolean;
}

export async function runPreflight(input: DoctorInput, deps: PreflightDeps = {}): Promise<DoctorOutput> {
  const env = deps.env ?? process.env;
  const commandAvailable = deps.commandAvailable ?? defaultCommandAvailable;
  const urlAvailable = deps.urlAvailable ?? defaultUrlAvailable;
  const pathAvailable = deps.pathAvailable ?? defaultPathAvailable;
  const packageAvailable = deps.packageAvailable ?? defaultPackageAvailable;
  const checks: PreflightCheck[] = [];

  const nodeVersion = deps.nodeVersion ?? process.versions.node;
  const nodeMajor = Number.parseInt(nodeVersion.split('.')[0] ?? '0', 10);
  checks.push(check('node', nodeMajor >= 20, true, nodeMajor >= 20 ? `Node ${nodeVersion}` : `Node 20+ required; found ${nodeVersion}`));

  if (!input.useBrief) {
    checks.push(check('anthropic_api_key', Boolean(env.ANTHROPIC_API_KEY), true, env.ANTHROPIC_API_KEY ? 'configured' : 'ANTHROPIC_API_KEY is missing'));
  }
  checks.push(check('ark_api_key', Boolean(env.ARK_API_KEY), true, env.ARK_API_KEY ? 'configured' : 'ARK_API_KEY is missing'));

  const comfyUrl = (env.COMFYUI_URL || 'http://127.0.0.1:8188').replace(/\/$/, '');
  const comfyOk = await urlAvailable(`${comfyUrl}/system_stats`);
  const displayComfyUrl = sanitizeUrlForLogs(comfyUrl);
  checks.push(check('comfyui', comfyOk, true, comfyOk ? `reachable at ${displayComfyUrl}` : `unreachable at ${displayComfyUrl}`));

  const ffmpeg = env.FFMPEG_PATH || 'ffmpeg';
  const ffprobe = env.FFPROBE_PATH || 'ffprobe';
  const [ffmpegOk, ffprobeOk] = await Promise.all([
    commandAvailable(ffmpeg),
    commandAvailable(ffprobe),
  ]);
  checks.push(check('ffmpeg', ffmpegOk, true, ffmpegOk ? 'available' : `${ffmpeg} is unavailable`));
  checks.push(check('ffprobe', ffprobeOk, true, ffprobeOk ? 'available' : `${ffprobe} is unavailable`));

  if (env.REMOTION_BROWSER_EXECUTABLE) {
    const browserOk = await pathAvailable(env.REMOTION_BROWSER_EXECUTABLE);
    checks.push(check('remotion_browser', browserOk, true, browserOk ? 'configured browser exists' : 'REMOTION_BROWSER_EXECUTABLE does not exist'));
  }

  if (input.includeSubtitles) {
    const whisperDir = env.EKTRO_WHISPER_INSTALL_DIR || env.HERMES_WHISPER_INSTALL_DIR || '';
    checks.push(check('whisper_install_dir', Boolean(whisperDir), true, whisperDir ? 'configured' : 'EKTRO_WHISPER_INSTALL_DIR is missing'));
    const whisperPackage = packageAvailable('@remotion/install-whisper-cpp');
    checks.push(check('whisper_package', whisperPackage, true, whisperPackage ? 'optional Whisper package installed' : '@remotion/install-whisper-cpp is not installed'));
  }

  const failed = checks.filter((row) => row.required && !row.ok);
  return {
    ok: failed.length === 0,
    message: failed.length === 0
      ? 'EKTRO-MV prerequisites are ready.'
      : `EKTRO-MV is not ready: ${failed.map((row) => row.name).join(', ')}`,
    checks,
    projectUrl: PROJECT_URL,
  };
}

function check(name: string, ok: boolean, required: boolean, message: string): PreflightCheck {
  return { name, ok, required, message };
}

async function defaultCommandAvailable(command: string): Promise<boolean> {
  try {
    await execFile(command, ['-version'], { timeout: 3_000, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function defaultUrlAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function defaultPathAvailable(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function defaultPackageAvailable(name: string): boolean {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}
