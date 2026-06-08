/**
 * Whisper-cpp wrapper — ported from hermes-studio.
 * Self-contained: Node built-ins only.
 *
 * Runtime-optional peer dependency:
 *   @remotion/install-whisper-cpp  (^4.0.0)
 *
 * This package does NOT list it in `dependencies` so that the package installs
 * and unit tests run without it (tests inject fakes). The real `ensureWhisper`
 * and `transcribeToSrt` functions do a dynamic `await import(...)` at call time.
 * Install it separately when you need actual transcription:
 *   pnpm add @remotion/install-whisper-cpp
 *
 * Env vars read at call time (no embedding):
 *   EKTRO_WHISPER_INSTALL_DIR  (preferred)
 *   HERMES_WHISPER_INSTALL_DIR (compat alias)
 *   EKTRO_WHISPER_MODEL        (preferred)
 *   HERMES_WHISPER_MODEL       (compat alias)
 *   FFMPEG_PATH                (ffmpeg binary, defaults to 'ffmpeg')
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';

export type WhisperModel =
  | 'tiny' | 'tiny.en' | 'base' | 'base.en'
  | 'small' | 'small.en' | 'medium' | 'medium.en'
  | 'large-v1' | 'large-v2' | 'large-v3' | 'large-v3-turbo';

export interface WhisperConfig {
  installDir: string;
  model?: WhisperModel;
  version?: string;
}

const DEFAULT_WHISPER_VERSION = '1.5.5';

export interface TranscribeOptions {
  audioPath: string;       // must be 16kHz wav; auto-convert via ffmpeg
  language?: string;       // 'zh' | 'en' | 'auto'
  translateToEnglish?: boolean;
}

export interface SrtCaption {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * Ensure whisper-cpp binary + model are installed.
 * Dynamically imports @remotion/install-whisper-cpp at call time.
 * Will throw if the package is not installed — install it as a runtime peer.
 */
// Use a variable to prevent TS from trying to resolve the optional peer's types.
const WHISPER_PKG = '@remotion/install-whisper-cpp';

export async function ensureWhisper(cfg: WhisperConfig): Promise<void> {
  if (!cfg.installDir) throw new Error('whisper: installDir is required');
  await mkdir(dirname(cfg.installDir), { recursive: true });
  // Dynamic import via variable keeps the package optional at install time
  // and prevents TS from requiring type declarations for the uninstalled peer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { installWhisperCpp, downloadWhisperModel } = await (import(/* @vite-ignore */ WHISPER_PKG) as Promise<any>);
  await installWhisperCpp({ to: cfg.installDir, version: cfg.version ?? DEFAULT_WHISPER_VERSION });
  await downloadWhisperModel({
    folder: cfg.installDir,
    model: cfg.model ?? 'medium',
  });
}

/**
 * Convert any audio file to 16kHz mono WAV using ffmpeg.
 * Uses FFMPEG_PATH env to locate the binary, falls back to 'ffmpeg'.
 */
export async function toMonoWav16k(inputPath: string, outputPath: string): Promise<string> {
  const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';
  await new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpegBin, [
      '-y', '-i', inputPath,
      '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le',
      outputPath,
    ], { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
  return outputPath;
}

/**
 * Transcribe a 16kHz mono WAV file to SRT captions.
 * Dynamically imports @remotion/install-whisper-cpp at call time.
 */
export async function transcribeToSrt(
  cfg: WhisperConfig,
  opts: TranscribeOptions & { srtPath: string },
): Promise<SrtCaption[]> {
  // Dynamic import via variable keeps the package optional at install time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { transcribe, toCaptions } = await (import(/* @vite-ignore */ WHISPER_PKG) as Promise<any>);
  const whisperCppOutput = await transcribe({
    inputPath: opts.audioPath,
    whisperPath: cfg.installDir,
    whisperCppVersion: cfg.version ?? DEFAULT_WHISPER_VERSION,
    model: cfg.model ?? 'medium',
    tokenLevelTimestamps: true,
    language: opts.language as 'zh' | 'en' | undefined,
    translateToEnglish: opts.translateToEnglish ?? false,
  });
  const captions = toCaptions({ whisperCppOutput }).captions;

  const srt: SrtCaption[] = (captions as Array<{ startMs: number; endMs: number; text: string }>).map((c, i) => ({
    index: i + 1,
    startMs: c.startMs,
    endMs: c.endMs,
    text: c.text.trim(),
  }));
  await writeFile(opts.srtPath, toSrtString(srt), 'utf8');
  return srt;
}

export function toSrtString(caps: SrtCaption[]): string {
  return caps.map(c =>
    `${c.index}\n${fmtTs(c.startMs)} --> ${fmtTs(c.endMs)}\n${c.text}\n`,
  ).join('\n');
}

function fmtTs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mm = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(mm, 3)}`;
}

function pad(n: number, w: number): string { return String(n).padStart(w, '0'); }
