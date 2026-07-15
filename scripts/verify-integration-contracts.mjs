import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const releaseVersion = '0.2.0';

const [
  mcpPackage,
  registry,
  hermesText,
  gooseText,
  libreChatText,
  openClawPackage,
  openClawManifest,
  openClawSource,
  httpGuide,
  mcpClients,
  upstreamPlaybook,
  releaseWorkflowText,
] = await Promise.all([
  readJson('mcp/ektro-mv-mcp/package.json'),
  readJson('mcp/ektro-mv-mcp/server.json'),
  read('integrations/hermes/optional-mcps/ektro-mv/manifest.yaml'),
  read('integrations/goose/ektro-mv.yaml'),
  read('integrations/librechat/librechat.example.yaml'),
  readJson('integrations/openclaw/package.json'),
  readJson('integrations/openclaw/openclaw.plugin.json'),
  read('integrations/openclaw/src/index.ts'),
  read('integrations/http-hosts.md'),
  read('integrations/mcp-clients.md'),
  read('integrations/upstream-submissions.md'),
  read('.github/workflows/release.yml'),
]);

const hermes = YAML.parse(hermesText);
const goose = YAML.parse(gooseText);
const libreChat = YAML.parse(libreChatText);
const releaseWorkflow = YAML.parse(releaseWorkflowText);

assert(mcpPackage.version === releaseVersion, 'MCP package release version drifted');
assert(mcpPackage.mcpName === registry.name, 'MCP Registry name must match npm mcpName');
assert(registry.version === releaseVersion, 'MCP Registry version drifted');
assert(registry.packages?.[0]?.identifier === '@ektro-mv/mcp', 'MCP Registry npm identifier drifted');
assert(registry.packages?.[0]?.transport?.type === 'stdio', 'MCP Registry must advertise stdio package transport');

assert(hermes.name === 'ektro-mv', 'Hermes catalog name drifted');
assert(hermes.transport?.type === 'stdio' && hermes.transport?.command === 'npx', 'Hermes must use stdio npx transport');
assert(hermes.transport?.args?.includes(`@ektro-mv/mcp@${releaseVersion}`), 'Hermes package version drifted');
assert(hermes.tools?.default_enabled?.includes('ektro_mv_doctor'), 'Hermes must enable doctor');
assert(hermes.tools?.default_enabled?.includes('ektro_mv_create'), 'Hermes must expose create');
assert(hermes.post_install?.includes('explicit confirmation'), 'Hermes install guidance must preserve external-call confirmation');

const gooseExtension = goose.extensions?.find((extension) => extension.name === 'ektro-mv');
assert(gooseExtension?.type === 'stdio' && gooseExtension?.cmd === 'npx', 'goose recipe must use stdio npx');
assert(gooseExtension?.args?.includes(`@ektro-mv/mcp@${releaseVersion}`), 'goose recipe version drifted');
assert(/explicit.*approv/i.test(goose.instructions ?? ''), 'goose recipe must preserve explicit approval');
assert(!gooseText.includes('ektroai.com'), 'goose upstream asset must stay instructional, not promotional');

const libreServer = libreChat.mcpServers?.['ektro-mv'];
assert(libreServer?.type === 'streamable-http', 'LibreChat Docker example must use Streamable HTTP');
assert(libreServer?.headers?.Authorization?.includes('EKTRO_MV_MCP_TOKEN'), 'LibreChat example must use a secret placeholder');
assert(libreServer?.timeout >= 1_800_000, 'LibreChat timeout is too short for generation');
assert(/explicit.*approv/i.test(libreServer?.serverInstructions ?? ''), 'LibreChat instructions must preserve explicit approval');

assert(openClawPackage.version === releaseVersion, 'OpenClaw package version drifted');
assert(openClawPackage.peerDependencies?.openclaw === '>=2026.5.17', 'OpenClaw minimum plugin API drifted');
assert(openClawManifest.contracts?.tools?.includes('ektro_mv_doctor'), 'OpenClaw manifest must declare doctor');
assert(openClawManifest.contracts?.tools?.includes('ektro_mv_create'), 'OpenClaw manifest must declare create');
assert(openClawManifest.toolMetadata?.ektro_mv_create?.optional === true, 'OpenClaw create tool must stay optional');
assert(openClawSource.includes("optional: true"), 'OpenClaw runtime must register create as optional');
assert(openClawSource.includes('Type.Literal(true'), 'OpenClaw create must require explicit confirmation');

for (const marker of [
  'Open WebUI',
  'n8n',
  'Dify',
  'Langflow',
  'Flowise',
  'EKTRO_MV_MCP_TOKEN',
  'EKTRO_MV_MCP_ALLOWED_HOSTS',
  'Do not expose this local bearer-token endpoint directly to the public internet',
]) {
  assert(httpGuide.includes(marker), `HTTP host guide missing ${marker}`);
}

for (const marker of [
  'Gemini CLI',
  'Qwen Code',
  'OpenCode',
  `@ektro-mv/mcp@${releaseVersion}`,
  'ektro_mv_doctor',
  'confirmedExternalCalls: true',
]) {
  assert(mcpClients.includes(marker), `MCP client guide missing ${marker}`);
}

for (const marker of [
  'optional-mcps/ektro-mv/manifest.yaml',
  'Do not open a core-repository PR',
  'one alphabetical `servers.json` entry',
  'common MCP server',
]) {
  assert(upstreamPlaybook.includes(marker), `Upstream playbook missing rule: ${marker}`);
}

assert(releaseWorkflow.permissions?.contents === 'read', 'Release workflow must keep contents read-only');
assert(releaseWorkflow.permissions?.['id-token'] === 'write', 'Release workflow must request OIDC');
assert(releaseWorkflow.jobs?.release?.environment === 'npm-release', 'Release workflow must use protected npm-release environment');
assert(releaseWorkflow.jobs?.release?.if?.includes("refs/heads/main"), 'Release workflow must be restricted to main');
assert(releaseWorkflowText.includes('package-manager-cache: false'), 'Release workflow must disable dependency caching');
assert(releaseWorkflowText.includes('scripts/release-packages.mjs'), 'Release workflow must use the audited release script');
for (const [workflow, text] of [
  ['release', releaseWorkflowText],
  ['ci', await read('.github/workflows/ci.yml')],
]) {
  const uses = [...text.matchAll(/^\s*- uses:\s+([^\s#]+)/gm)].map((match) => match[1]);
  assert(uses.length >= 3, `${workflow} workflow must declare its expected actions`);
  for (const action of uses) {
    assert(/@[0-9a-f]{40}$/.test(action), `${workflow} workflow action must be pinned to a full commit SHA: ${action}`);
  }
}

process.stdout.write('Verified ecosystem integration contracts and the protected npm release workflow.\n');

async function read(path) {
  return readFile(resolve(root, path), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
