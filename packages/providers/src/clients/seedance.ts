/**
 * Seedance video generation client — ported from hermes-studio.
 * Self-contained: Node built-ins + global fetch only.
 * API key is read from the constructor config only — never from hardcoded values.
 */
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

// ---- Types ----

export type SeedanceModel =
  | 'doubao-seedance-2-0-260128'
  | 'doubao-seedance-2-0-fast-260128'
  | (string & {});

/** Fast model id for cheap v1 runs. */
export const SEEDANCE_FAST_MODEL: SeedanceModel = 'doubao-seedance-2-0-fast-260128';
/** Default (full quality) model id. */
export const SEEDANCE_DEFAULT_MODEL: SeedanceModel = 'doubao-seedance-2-0-260128';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9' | 'adaptive';
export type Resolution = '480p' | '720p' | '1080p';

/** Role values for image parts — required by Seedance 2.0 for image_url content. */
export type ImageRole = 'first_frame' | 'last_frame' | 'reference_image';

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string }; role?: ImageRole };

export interface CreateTaskRequest {
  model: SeedanceModel;
  content: ContentPart[];
  callback_url?: string;
}

export interface CreateTaskResponse {
  id: string;
}

export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface TaskInfo {
  id: string;
  model: string;
  status: TaskStatus;
  content?: { video_url?: string };
  error?: { code: string; message: string };
  usage?: { completion_tokens?: number; total_tokens?: number };
  created_at?: number;
  updated_at?: number;
}

export interface PromptOptions {
  resolution?: Resolution;
  ratio?: AspectRatio;
  duration?: number;   // seconds (5 / 10)
  fps?: number;        // 24 fixed in seedance 2.0
  seed?: number;
  watermark?: boolean;
  camerafixed?: boolean;
}

export interface GenerateVideoInput {
  prompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  refImages?: string[];
  model?: SeedanceModel;
  options?: PromptOptions;
}

// ---- Client ----

export interface SeedanceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  fetchImpl?: typeof fetch;
  /** Network retries for transient failures. Default 4. */
  retries?: number;
}

export class SeedanceClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: SeedanceConfig) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
    this.defaultModel = cfg.defaultModel ?? SEEDANCE_DEFAULT_MODEL;
    const base = cfg.fetchImpl ?? fetch;
    this.fetchImpl = makeRetryingFetch(base, cfg.retries ?? 4);
  }

  async createTask(req: CreateTaskRequest): Promise<CreateTaskResponse> {
    if (!this.apiKey) throw new Error('SeedanceClient: apiKey is required (set ARK_API_KEY)');
    const res = await this.fetchImpl(`${this.baseUrl}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Seedance createTask ${res.status}: ${text}`);
    }
    return res.json() as Promise<CreateTaskResponse>;
  }

  async getTask(taskId: string): Promise<TaskInfo> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/contents/generations/tasks/${encodeURIComponent(taskId)}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Seedance getTask ${res.status}: ${text}`);
    }
    return res.json() as Promise<TaskInfo>;
  }

  async waitTask(taskId: string, opts?: {
    intervalMs?: number; timeoutMs?: number; onUpdate?: (t: TaskInfo) => void;
  }): Promise<TaskInfo> {
    const interval = opts?.intervalMs ?? 4000;
    const timeout = opts?.timeoutMs ?? 15 * 60 * 1000;
    const start = Date.now();
    while (true) {
      const info = await this.getTask(taskId);
      opts?.onUpdate?.(info);
      if (info.status === 'succeeded' || info.status === 'failed' || info.status === 'cancelled') {
        return info;
      }
      if (Date.now() - start > timeout) throw new Error(`Seedance waitTask timeout: ${taskId}`);
      await new Promise(r => setTimeout(r, interval));
    }
  }

  async generateVideo(input: GenerateVideoInput, opts?: {
    onUpdate?: (t: TaskInfo) => void;
  }): Promise<TaskInfo> {
    const content = buildContent(input);
    const { id } = await this.createTask({
      model: input.model ?? this.defaultModel,
      content,
    });
    return this.waitTask(id, { onUpdate: opts?.onUpdate });
  }
}

export function buildPromptWithOptions(prompt: string, options?: PromptOptions): string {
  if (!options) return prompt;
  const suffix: string[] = [];
  if (options.resolution) suffix.push(`--rs ${options.resolution}`);
  if (options.ratio) suffix.push(`--ratio ${options.ratio}`);
  if (options.duration) suffix.push(`--dur ${options.duration}`);
  if (options.fps) suffix.push(`--fps ${options.fps}`);
  if (options.seed != null) suffix.push(`--seed ${options.seed}`);
  if (options.watermark != null) suffix.push(`--wm ${options.watermark ? 'true' : 'false'}`);
  if (options.camerafixed != null) suffix.push(`--cf ${options.camerafixed ? 'true' : 'false'}`);
  return suffix.length ? `${prompt.trim()} ${suffix.join(' ')}` : prompt;
}

/**
 * Download a Seedance-generated video from a CDN URL to a local path.
 * Uses arrayBuffer() to avoid streaming pipe issues with partial writes.
 * Retries with exponential backoff. Validates minimum file size.
 */
export async function downloadVideo(
  url: string,
  destPath: string,
  maxRetries = parseInt(process.env.SEEDANCE_DOWNLOAD_RETRIES ?? '4', 10),
): Promise<string> {
  await mkdir(dirname(destPath), { recursive: true });

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download HTTP ${res.status}: ${url.slice(0, 80)}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 50_000) throw new Error(`download too small (${buf.length} bytes), likely partial`);
      await writeFile(destPath, buf);
      return destPath;
    } catch (err) {
      lastErr = err;
      await unlink(destPath).catch(() => {});
      if (attempt < maxRetries) {
        const delay = Math.min(30_000, 1_000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(
    `Seedance download failed after ${maxRetries} attempts: ${(lastErr as Error)?.message ?? lastErr}`,
  );
}

// ---- Private helpers ----

function makeRetryingFetch(base: typeof fetch, maxRetries: number): typeof fetch {
  return async (input, init) => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await base(input, init);
        if (res.status >= 500 || res.status === 429) {
          if (attempt < maxRetries) { await sleep(backoffMs(attempt)); continue; }
        }
        return res;
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) { await sleep(backoffMs(attempt)); continue; }
      }
    }
    throw lastErr ?? new Error('Seedance fetch failed after retries');
  };
}

function backoffMs(attempt: number): number {
  return 800 * Math.pow(2, attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function buildContent(input: GenerateVideoInput): ContentPart[] {
  const parts: ContentPart[] = [];
  parts.push({ type: 'text', text: buildPromptWithOptions(input.prompt, input.options) });
  if (input.firstFrameUrl) {
    parts.push({ type: 'image_url', role: 'first_frame', image_url: { url: input.firstFrameUrl } });
  }
  if (input.lastFrameUrl) {
    parts.push({ type: 'image_url', role: 'last_frame', image_url: { url: input.lastFrameUrl } });
  }
  if (input.refImages) for (const url of input.refImages) {
    parts.push({ type: 'image_url', role: 'reference_image', image_url: { url } });
  }
  return parts;
}
