#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createEktroMvServer } from './server.js';
import { createRuntime } from './runtime.js';

async function main() {
  const server = createEktroMvServer(createRuntime());
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  process.stderr.write(`ektro-mv-mcp fatal: ${(error as Error).message}\n`);
  process.exit(1);
});
