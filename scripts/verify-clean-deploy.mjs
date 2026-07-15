import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, URL } from 'node:url';
import { promisify } from 'node:util';
import process from 'node:process';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const packDir = await mkdtemp(join(tmpdir(), 'ektro-mv-clean-pack-'));
const installDir = await mkdtemp(join(tmpdir(), 'ektro-mv-clean-install-'));
const selectors = [
  '@ektro-mv/core',
  '@ektro-mv/providers',
  '@ektro-mv/remotion',
  '@ektro-mv/composite',
  '@ektro-mv/cli',
  '@ektro-mv/mcp',
];

try {
  for (const selector of selectors) {
    await execFile('pnpm', ['--filter', selector, 'pack', '--pack-destination', packDir], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
  }
  await writeFile(join(installDir, 'package.json'), '{"name":"ektro-mv-clean-install","private":true}\n');
  const tarballs = (await readdir(packDir)).filter((file) => file.endsWith('.tgz')).map((file) => join(packDir, file));
  assert(tarballs.length === selectors.length, `expected ${selectors.length} tarballs, found ${tarballs.length}`);
  await execFile('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs], {
    cwd: installDir,
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });

  const sdkRoot = join(installDir, 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'esm');
  const { Client } = await import(pathToFileURL(join(sdkRoot, 'client', 'index.js')).href);
  const { StdioClientTransport } = await import(pathToFileURL(join(sdkRoot, 'client', 'stdio.js')).href);
  const { StreamableHTTPClientTransport } = await import(pathToFileURL(join(sdkRoot, 'client', 'streamableHttp.js')).href);
  const client = new Client({ name: 'ektro-mv-clean-install', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(installDir, 'node_modules', '@ektro-mv', 'mcp', 'dist', 'bin.js')],
    cwd: installDir,
    stderr: 'pipe',
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name);
    assert(JSON.stringify(names) === JSON.stringify(['ektro_mv_doctor', 'ektro_mv_create']), `unexpected tool list: ${names.join(', ')}`);

    const doctor = await client.callTool({
      name: 'ektro_mv_doctor',
      arguments: { useBrief: true, includeSubtitles: false },
    });
    assert(typeof doctor.structuredContent?.ok === 'boolean', 'doctor did not return structured content');
    assert(!doctor.structuredContent.checks.some((row) => row.name === 'anthropic_api_key'), 'brief-mode doctor incorrectly required Anthropic');
  } finally {
    await client.close();
  }

  const mcpEntry = join(installDir, 'node_modules', '@ektro-mv', 'mcp', 'dist', 'index.js');
  const { createHttpApp, listenHttp } = await import(pathToFileURL(mcpEntry).href);
  const httpConfig = { host: '127.0.0.1', port: 0, token: 'clean-install-token' };
  const httpServer = await listenHttp(createHttpApp(httpConfig, {
    runtime: {
      doctor: async () => ({ ok: true, message: 'ready', checks: [], projectUrl: 'https://github.com/HorizonNowhere/EKTRO-MV' }),
      run: async () => { throw new Error('generation is not part of clean-install verification'); },
    },
  }), httpConfig);
  const port = httpServer.address().port;
  const httpClient = new Client({ name: 'ektro-mv-clean-http', version: '1.0.0' });
  const httpTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
    requestInit: { headers: { authorization: 'Bearer clean-install-token' } },
  });
  try {
    await httpClient.connect(httpTransport);
    const doctor = await httpClient.callTool({ name: 'ektro_mv_doctor', arguments: { useBrief: true } });
    assert(doctor.structuredContent?.ok === true, 'HTTP doctor did not return a successful structured result');
  } finally {
    await httpClient.close();
    await new Promise((resolve) => httpServer.close(resolve));
  }

  const require = createRequire(join(installDir, 'package.json'));
  const entry = require.resolve('@ektro-mv/remotion/entry');
  assert(entry.includes('@ektro-mv/remotion'), `Remotion entry did not resolve through the package: ${entry}`);

  process.stdout.write('Verified clean tarball install, stdio/HTTP MCP handshakes, doctor contract, and Remotion entry.\n');
} finally {
  await Promise.all([
    rm(packDir, { recursive: true, force: true }),
    rm(installDir, { recursive: true, force: true }),
  ]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
