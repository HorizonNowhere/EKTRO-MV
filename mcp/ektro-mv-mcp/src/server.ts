import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createInputSchema,
  createOutputSchema,
  doctorInputSchema,
  doctorOutputSchema,
  handleCreate,
  handleDoctor,
  type CreateDeps,
  type DoctorDeps,
} from './handler.js';

export function createEktroMvServer(deps: CreateDeps & DoctorDeps): McpServer {
  const server = new McpServer({ name: 'ektro-mv', version: '0.2.0' });
  server.registerTool(
    'ektro_mv_doctor',
    {
      title: 'Check EKTRO-MV prerequisites',
      description: 'Read-only preflight for Node, API-key presence, ComfyUI, ffmpeg/ffprobe, and optional subtitles.',
      inputSchema: doctorInputSchema.shape,
      outputSchema: doctorOutputSchema.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args) => handleDoctor(args, deps),
  );
  server.registerTool(
    'ektro_mv_create',
    {
      title: 'Create a music video',
      description: 'Create a finished MP4 from one sentence or a reviewed CreativeBrief. This writes local files and may invoke paid external model APIs.',
      inputSchema: createInputSchema.shape,
      outputSchema: createOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (args) => handleCreate(args, deps),
  );
  return server;
}
