import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createEktroMvServer } from '../src/server.js';
import { PROJECT_URL } from '../src/handler.js';

describe('MCP protocol contract', () => {
  const closers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.allSettled(closers.splice(0).map((close) => close()));
  });

  it('advertises doctor/create and returns output-schema-valid structured content', async () => {
    const server = createEktroMvServer({
      doctor: async () => ({ ok: true, message: 'ready', checks: [], projectUrl: PROJECT_URL }),
      run: async () => ({
        runId: 'run-1',
        outputMp4: '/tmp/ektro-mv.mp4',
        briefTitle: 'Neon',
        workDir: '/tmp',
        subtitles: false,
      }),
    });
    const client = new Client({ name: 'ektro-mv-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closers.push(() => client.close(), () => server.close());

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(['ektro_mv_doctor', 'ektro_mv_create']);

    const doctor = await client.callTool({ name: 'ektro_mv_doctor', arguments: { useBrief: true } });
    expect(doctor.structuredContent).toMatchObject({ ok: true, projectUrl: PROJECT_URL });

    const created = await client.callTool({ name: 'ektro_mv_create', arguments: { prompt: 'cyberpunk anthem', confirmedExternalCalls: true } });
    expect(created.structuredContent).toMatchObject({ ok: true, outputMp4: '/tmp/ektro-mv.mp4' });
  });
});
