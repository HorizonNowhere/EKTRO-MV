import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const createInputSchema = z.object({
  prompt: z.string().describe('One sentence describing the music video to create'),
  workDir: z.string().optional().describe('Optional working directory for outputs'),
});
export type CreateInput = z.infer<typeof createInputSchema>;

export interface CreateDeps {
  run: (oneLiner: string, workDir?: string) => Promise<{ outputMp4: string; briefTitle: string }>;
}

export async function handleCreate(args: CreateInput, deps: CreateDeps): Promise<CallToolResult> {
  const prompt = (args.prompt ?? '').trim();
  if (!prompt) return { content: [{ type: 'text', text: 'error: prompt must not be empty' }], isError: true };
  try {
    const { outputMp4, briefTitle } = await deps.run(prompt, args.workDir);
    return { content: [{ type: 'text', text: `Created MV "${briefTitle}" → ${outputMp4}` }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `error: ${(e as Error).message}` }], isError: true };
  }
}
