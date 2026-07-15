import { createRuntime, handleCreate, handleDoctor } from '@ektro-mv/mcp';
import { defineToolPlugin } from 'openclaw/plugin-sdk/tool-plugin';
import { Type } from 'typebox';

const runtime = createRuntime();

export default defineToolPlugin({
  id: 'ektro-mv',
  name: 'EKTRO-MV',
  description: 'Check prerequisites and create delivery-ready music videos.',
  tools: (tool) => [
    tool({
      name: 'ektro_mv_doctor',
      label: 'Check EKTRO-MV prerequisites',
      description: 'Read-only check for API-key presence, ComfyUI, ffmpeg/ffprobe, and optional subtitles.',
      parameters: Type.Object({
        useBrief: Type.Optional(Type.Boolean({ description: 'Do not require Anthropic when a reviewed brief will be supplied.' })),
        includeSubtitles: Type.Optional(Type.Boolean({ description: 'Also validate optional Whisper requirements.' })),
      }),
      async execute(params) {
        const result = await handleDoctor(params, runtime);
        return result.structuredContent ?? { ok: false, message: 'EKTRO-MV doctor returned no structured result.' };
      },
    }),
    tool({
      name: 'ektro_mv_create',
      label: 'Create an EKTRO-MV music video',
      description: 'Create a finished MP4. Writes local files and may call paid external model APIs.',
      optional: true,
      parameters: Type.Object({
        prompt: Type.Optional(Type.String({ minLength: 1, description: 'One-sentence creative direction.' })),
        brief: Type.Optional(Type.Unknown({ description: 'A reviewed EKTRO-MV CreativeBrief; mutually exclusive with prompt.' })),
        outputDir: Type.Optional(Type.String({ minLength: 1, description: 'Relative directory below EKTRO_MV_OUTPUT_ROOT.' })),
        skipSubtitles: Type.Optional(Type.Boolean({ default: true })),
        confirmedExternalCalls: Type.Literal(true, {
          description: 'Set only after the user explicitly approves external model calls and possible cost.',
        }),
      }),
      async execute(params) {
        const result = await handleCreate(params, runtime);
        return result.structuredContent ?? { ok: false, message: 'EKTRO-MV create returned no structured result.' };
      },
    }),
  ],
});
