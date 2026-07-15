import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import process from 'node:process';

const execFile = promisify(execFileCallback);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packDir = await mkdtemp(resolve(tmpdir(), 'ektro-mv-package-verify-'));
const packages = [
  { dir: 'packages/core', allowed: ['dist/', 'LICENSE', 'package.json'] },
  { dir: 'packages/providers', allowed: ['dist/', 'LICENSE', 'package.json'] },
  { dir: 'packages/composite', allowed: ['dist/', 'LICENSE', 'package.json'] },
  { dir: 'packages/cli', allowed: ['dist/', 'LICENSE', 'package.json'] },
  { dir: 'mcp/ektro-mv-mcp', allowed: ['dist/', 'LICENSE', 'README.md', 'package.json', 'server.json'] },
  { dir: 'apps/remotion', allowed: ['src/', 'LICENSE', 'remotion.config.ts', 'package.json'] },
];

try {
  for (const spec of packages) {
    const cwd = resolve(root, spec.dir);
    const sourceManifest = JSON.parse(await readFile(resolve(cwd, 'package.json'), 'utf8'));
    await execFile('pnpm', ['pack', '--pack-destination', packDir], { cwd, maxBuffer: 10 * 1024 * 1024 });
    const tarball = await findTarball(packDir, sourceManifest.name, sourceManifest.version);
    const { stdout: manifestText } = await execFile('tar', ['-xOf', tarball, 'package/package.json']);
    const manifest = JSON.parse(manifestText);
    const { stdout: contents } = await execFile('tar', ['-tzf', tarball]);
    const files = contents.trim().split('\n').map((file) => file.replace(/^package\//, ''));

    assert(manifest.private !== true, `${manifest.name}: package must be public`);
    assert(manifest.version === '0.2.0', `${manifest.name}: expected version 0.2.0`);
    assert(manifest.license === 'MIT', `${manifest.name}: MIT license metadata missing`);
    assert(manifest.repository?.url, `${manifest.name}: repository metadata missing`);
    assert(manifest.engines?.node, `${manifest.name}: Node engine missing`);
    assert(manifest.publishConfig?.access === 'public', `${manifest.name}: publishConfig.access must be public`);
    assert(!manifestText.includes('workspace:'), `${manifest.name}: workspace protocol leaked into tarball`);
    for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
      if (name.startsWith('@ektro-mv/')) {
        assert(version === '0.2.0', `${manifest.name}: ${name} must be pinned to 0.2.0 in the tarball`);
      }
    }

    for (const file of files) {
      assert(spec.allowed.some((prefix) => file === prefix || file.startsWith(prefix)), `${manifest.name}: unexpected packed file ${file}`);
    }
    assert(files.includes('package.json'), `${manifest.name}: package.json missing from tarball`);
    if (manifest.bin) {
      for (const target of Object.values(manifest.bin)) {
        assert(files.includes(String(target).replace(/^\.\//, '')), `${manifest.name}: bin target ${target} missing from tarball`);
      }
    }
    if (manifest.name === '@ektro-mv/remotion') {
      assert(files.includes('src/index.ts'), '@ektro-mv/remotion: composition entry missing');
    }
    if (manifest.name === '@ektro-mv/mcp') {
      assert(manifest.mcpName === 'io.github.horizonnowhere/ektro-mv', '@ektro-mv/mcp: mcpName missing');
      assert(files.includes('server.json'), '@ektro-mv/mcp: Registry server.json missing');
      assert(files.includes('README.md'), '@ektro-mv/mcp: bilingual package README missing');
      const { stdout: registryText } = await execFile('tar', ['-xOf', tarball, 'package/server.json']);
      const registry = JSON.parse(registryText);
      assert(registry.name === manifest.mcpName, '@ektro-mv/mcp: Registry name does not match mcpName');
      assert(registry.version === manifest.version, '@ektro-mv/mcp: Registry version does not match package version');
    }
  }

  const compositeJs = await readFile(resolve(root, 'packages/composite/dist/remotion-composite.js'), 'utf8');
  assert(compositeJs.includes('@ektro-mv/remotion/entry'), 'composite: published composition package is not resolved');
  assert(!compositeJs.includes('../../../apps/remotion'), 'composite: monorepo-relative Remotion path leaked into dist');

  process.stdout.write(`Verified ${packages.length} publishable package tarballs.\n`);
} finally {
  await rm(packDir, { recursive: true, force: true });
}

async function findTarball(directory, packageName, version) {
  const expected = `${packageName.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
  const files = await readdir(directory);
  const filename = files.find((file) => file === expected);
  assert(filename, `${packageName}: pnpm pack did not create ${expected}`);
  return resolve(directory, filename);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
