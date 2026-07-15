#!/usr/bin/env node
import { createHttpApp, listenHttp, loadHttpConfig } from './http.js';
import { createRuntime } from './runtime.js';

async function main() {
  const config = loadHttpConfig();
  const server = await listenHttp(createHttpApp(config, { runtime: createRuntime() }), config);
  process.stderr.write(`ektro-mv-mcp HTTP listening on http://${formatHost(config.host)}:${config.port}/mcp\n`);

  const shutdown = () => server.close(() => process.exit(0));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

function formatHost(host: string): string {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

main().catch((error) => {
  process.stderr.write(`ektro-mv-mcp-http fatal: ${(error as Error).message}\n`);
  process.exit(1);
});
