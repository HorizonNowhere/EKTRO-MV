/**
 * ComfyUI HTTP client + ACE-Step workflow builder — ported from hermes-studio.
 * Self-contained: Node built-ins + global fetch only.
 */
import { randomUUID } from 'node:crypto';

// ---- Types ----

export interface ComfyUIConfig {
  baseUrl?: string;
  clientId?: string;
  fetchImpl?: typeof fetch;
}

export interface QueuePromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, unknown>;
}

export interface ComfyAudioEntry {
  filename: string;
  subfolder: string;
  type: string;
}

export interface ComfyImageEntry {
  filename: string;
  subfolder: string;
  type: string;
}

export interface ComfyHistoryEntry {
  prompt: unknown;
  outputs: Record<string, {
    images?: ComfyImageEntry[];
    audio?: ComfyAudioEntry[];
  }>;
  status: { status_str: string; completed: boolean };
}

export interface HistoryResponse {
  [promptId: string]: ComfyHistoryEntry;
}

// ---- Client ----

export class ComfyUIClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: ComfyUIConfig = {}) {
    this.baseUrl = (cfg.baseUrl ?? 'http://127.0.0.1:8188').replace(/\/$/, '');
    this.clientId = cfg.clientId ?? randomUUID();
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  async queuePrompt(workflow: unknown): Promise<QueuePromptResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: this.clientId }),
    });
    if (!res.ok) throw new Error(`comfyui queuePrompt ${res.status}: ${await res.text()}`);
    return res.json() as Promise<QueuePromptResponse>;
  }

  async getHistory(promptId: string): Promise<HistoryResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/history/${promptId}`);
    if (!res.ok) throw new Error(`comfyui history ${res.status}`);
    return res.json() as Promise<HistoryResponse>;
  }

  async waitPrompt(promptId: string, opts?: { intervalMs?: number; timeoutMs?: number }): Promise<ComfyHistoryEntry> {
    const iv = opts?.intervalMs ?? 1500;
    const to = opts?.timeoutMs ?? 10 * 60 * 1000;
    const t0 = Date.now();
    while (true) {
      const h = await this.getHistory(promptId);
      const row = h[promptId];
      if (row?.status?.completed) return row;
      if (Date.now() - t0 > to) throw new Error(`comfyui waitPrompt timeout`);
      await new Promise(r => setTimeout(r, iv));
    }
  }

  /** Build the /view URL for any output file (image or audio). */
  fileUrl(filename: string, subfolder = '', type = 'output'): string {
    const p = new URLSearchParams({ filename, subfolder, type });
    return `${this.baseUrl}/view?${p}`;
  }

  /** Download any output file (images, audio) via the /view endpoint. */
  async downloadOutput(filename: string, subfolder = '', type = 'output'): Promise<ArrayBuffer> {
    const res = await this.fetchImpl(this.fileUrl(filename, subfolder, type));
    if (!res.ok) throw new Error(`comfyui download ${res.status}`);
    return res.arrayBuffer();
  }

  /** Alias kept for symmetry with hermes-studio — delegates to downloadOutput. */
  async downloadImage(filename: string, subfolder = '', type = 'output'): Promise<ArrayBuffer> {
    return this.downloadOutput(filename, subfolder, type);
  }

  async uploadImage(filename: string, data: Blob | Uint8Array, subfolder = ''): Promise<{ name: string; subfolder: string; type: string }> {
    const form = new FormData();
    const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart]);
    form.append('image', blob, filename);
    if (subfolder) form.append('subfolder', subfolder);
    form.append('overwrite', 'true');
    const res = await this.fetchImpl(`${this.baseUrl}/upload/image`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`comfyui upload ${res.status}: ${await res.text()}`);
    return res.json() as Promise<{ name: string; subfolder: string; type: string }>;
  }
}

// ---- ACE-Step workflow builder ----

export interface AceStepInput {
  tags: string;              // genre/mood tags, e.g. "cinematic, orchestral, epic, tense"
  lyrics?: string;           // optional; empty = instrumental
  durationSec?: number;      // 30 / 60 / 120 / 240
  seed?: number;
  steps?: number;
  cfg?: number;
  filenamePrefix?: string;
  checkpointName?: string;   // ace_step_v1_3.5b.safetensors
}

export function buildAceStepWorkflow(input: AceStepInput): Record<string, unknown> {
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const duration = input.durationSec ?? 60;
  const steps = input.steps ?? 27;
  const cfg = input.cfg ?? 5.0;
  const prefix = input.filenamePrefix ?? 'ektro-ace-step';
  const ckpt = input.checkpointName ?? 'ace_step_v1_3.5b.safetensors';

  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: ckpt },
    },
    '2': {
      class_type: 'EmptyAceStepLatentAudio',
      inputs: { seconds: duration, batch_size: 1 },
    },
    '3': {
      class_type: 'TextEncodeAceStepAudio',
      inputs: {
        tags: input.tags,
        lyrics: input.lyrics ?? '',
        lyrics_strength: 0.99,
        clip: ['1', 1],
      },
    },
    '4': {
      class_type: 'ConditioningZeroOut',
      inputs: { conditioning: ['3', 0] },
    },
    '5': {
      class_type: 'ModelSamplingSD3',
      inputs: { shift: 5.0, model: ['1', 0] },
    },
    '6': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: 1.0,
        model: ['5', 0],
        positive: ['3', 0],
        negative: ['4', 0],
        latent_image: ['2', 0],
      },
    },
    '7': {
      class_type: 'VAEDecodeAudio',
      inputs: { samples: ['6', 0], vae: ['1', 2] },
    },
    '8': {
      class_type: 'SaveAudio',
      inputs: { filename_prefix: prefix, audio: ['7', 0] },
    },
  };
}
