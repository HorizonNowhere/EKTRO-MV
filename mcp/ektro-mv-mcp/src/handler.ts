import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { CreativeBriefSchema } from '@ektro-mv/core';

export const createInputSchema = z.object({
  prompt: z.string().trim().min(1).optional().describe('One sentence describing the music video to create'),
  brief: CreativeBriefSchema.optional().describe('A validated CreativeBrief; skips the LLM brain and ANTHROPIC_API_KEY'),
  outputDir: z.string().trim().min(1).optional().describe('Relative output directory below EKTRO_MV_OUTPUT_ROOT'),
  skipSubtitles: z.boolean().default(true).describe('Skip Whisper captions (default: true)'),
  confirmedExternalCalls: z.literal(true).describe('True only after the user explicitly approved external model calls and their possible cost'),
});
export type CreateInput = z.infer<typeof createInputSchema>;

export const createOutputSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  errorCode: z.string().optional(),
  runId: z.string().optional(),
  outputMp4: z.string().optional(),
  briefTitle: z.string().optional(),
  workDir: z.string().optional(),
  subtitles: z.boolean().optional(),
  projectUrl: z.string().url(),
});
export type CreateOutput = z.infer<typeof createOutputSchema>;

export const doctorInputSchema = z.object({
  useBrief: z.boolean().default(false).describe('Do not require ANTHROPIC_API_KEY when a structured brief will be supplied'),
  includeSubtitles: z.boolean().default(false).describe('Also validate optional Whisper requirements'),
});
export type DoctorInput = z.infer<typeof doctorInputSchema>;

export const doctorOutputSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  checks: z.array(z.object({
    name: z.string(),
    ok: z.boolean(),
    required: z.boolean(),
    message: z.string(),
  })),
  projectUrl: z.string().url(),
});
export type DoctorOutput = z.infer<typeof doctorOutputSchema>;

export interface CreateRunResult {
  runId: string;
  outputMp4: string;
  briefTitle: string;
  workDir: string;
  subtitles: boolean;
}

export interface CreateDeps {
  run: (input: CreateInput) => Promise<CreateRunResult>;
}

export interface DoctorDeps {
  doctor: (input: DoctorInput) => Promise<DoctorOutput>;
}

export const PROJECT_URL = 'https://github.com/HorizonNowhere/EKTRO-MV';

export async function handleCreate(args: unknown, deps: CreateDeps): Promise<CallToolResult> {
  const parsed = createInputSchema.safeParse(args);
  if (!parsed.success) {
    return createError('invalid_input', formatIssues(parsed.error.issues));
  }
  const input = parsed.data;
  if (Boolean(input.prompt) === Boolean(input.brief)) {
    return createError('invalid_input', "Provide exactly one of 'prompt' or 'brief'.");
  }
  try {
    const result = await deps.run(input);
    const output: CreateOutput = {
      ok: true,
      message: `Created MV "${result.briefTitle}" -> ${result.outputMp4}`,
      ...result,
      projectUrl: PROJECT_URL,
    };
    return {
      content: [{ type: 'text', text: output.message }],
      structuredContent: output,
    };
  } catch (error) {
    const errorCode = getErrorCode(error);
    const message = error instanceof Error ? error.message : 'EKTRO-MV generation failed';
    return createError(errorCode, message);
  }
}

export async function handleDoctor(args: unknown, deps: DoctorDeps): Promise<CallToolResult> {
  const parsed = doctorInputSchema.safeParse(args);
  if (!parsed.success) {
    const output: DoctorOutput = {
      ok: false,
      message: formatIssues(parsed.error.issues),
      checks: [],
      projectUrl: PROJECT_URL,
    };
    return { content: [{ type: 'text', text: output.message }], structuredContent: output, isError: true };
  }
  const output = await deps.doctor(parsed.data);
  return {
    content: [{ type: 'text', text: output.message }],
    structuredContent: output,
    isError: !output.ok,
  };
}

function createError(errorCode: string, message: string): CallToolResult {
  const output: CreateOutput = {
    ok: false,
    errorCode,
    message,
    projectUrl: PROJECT_URL,
  };
  return {
    content: [{ type: 'text', text: `error [${errorCode}]: ${message}` }],
    structuredContent: output,
    isError: true,
  };
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'errorCode' in error) {
    const value = (error as { errorCode?: unknown }).errorCode;
    if (typeof value === 'string' && value) return value;
  }
  return 'generation_failed';
}

function formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>): string {
  return issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}
