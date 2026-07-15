import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createHttpApp, listenHttp, loadHttpConfig } from '../src/http.js';
import { PROJECT_URL } from '../src/handler.js';

describe('Streamable HTTP MCP transport', () => {
  const closers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.allSettled(closers.splice(0).map((close) => close()));
  });

  it('serves MCP over HTTP with bearer authentication', async () => {
    const config = { host: '127.0.0.1', port: 0, token: 'test-token' };
    const server = await listenHttp(createHttpApp(config, {
      runtime: {
        doctor: async () => ({ ok: true, message: 'ready', checks: [], projectUrl: PROJECT_URL }),
        run: async () => ({
          runId: 'http-run',
          outputMp4: '/tmp/http.mp4',
          briefTitle: 'HTTP',
          workDir: '/tmp',
          subtitles: false,
        }),
      },
    }), config);
    closers.push(() => new Promise((resolve) => server.close(() => resolve())));
    const port = (server.address() as AddressInfo).port;
    const endpoint = new URL(`http://127.0.0.1:${port}/mcp`);

    const unauthorized = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    });
    expect(unauthorized.status).toBe(401);

    const client = new Client({ name: 'ektro-mv-http-test', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: { authorization: 'Bearer test-token' } },
    });
    await client.connect(transport);
    closers.push(() => client.close());

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(['ektro_mv_doctor', 'ektro_mv_create']);
    const doctor = await client.callTool({ name: 'ektro_mv_doctor', arguments: { useBrief: true } });
    expect(doctor.structuredContent).toMatchObject({ ok: true, projectUrl: PROJECT_URL });
  });

  it('fails closed for non-loopback binding without token and host allowlist', () => {
    expect(() => loadHttpConfig({ EKTRO_MV_MCP_HOST: '0.0.0.0' })).toThrow(/TOKEN/);
    expect(() => loadHttpConfig({
      EKTRO_MV_MCP_HOST: '0.0.0.0',
      EKTRO_MV_MCP_TOKEN: 'token',
    })).toThrow(/ALLOWED_HOSTS/);
    expect(loadHttpConfig({
      EKTRO_MV_MCP_HOST: '0.0.0.0',
      EKTRO_MV_MCP_TOKEN: 'token',
      EKTRO_MV_MCP_ALLOWED_HOSTS: 'media.internal, localhost',
      EKTRO_MV_MCP_PORT: '4123',
    })).toEqual({
      host: '0.0.0.0',
      port: 4123,
      token: 'token',
      allowedHosts: ['media.internal', 'localhost'],
    });
  });
});
