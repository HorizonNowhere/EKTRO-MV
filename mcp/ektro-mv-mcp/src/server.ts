import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createInputSchema, handleCreate, type CreateDeps } from './handler.js';

export function createEktroMvServer(deps: CreateDeps): McpServer {
  const server = new McpServer({ name: 'ektro-mv', version: '0.1.0' });
  server.registerTool(
    'ektro_mv_create',
    {
      title: 'Create a music video',
      description: 'Create a music video from one sentence (writes song+video+subtitles, renders an MP4).',
      inputSchema: createInputSchema.shape,
    },
    async (args) => handleCreate(args, deps),
  );
  return server;
}
