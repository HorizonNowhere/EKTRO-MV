import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = optionValue('--version');
const publish = process.argv.includes('--publish');
const dryRun = process.argv.includes('--dry-run');
const packages = [
  { name: '@ektro-mv/core', directory: 'packages/core' },
  { name: '@ektro-mv/providers', directory: 'packages/providers' },
  { name: '@ektro-mv/remotion', directory: 'apps/remotion' },
  { name: '@ektro-mv/composite', directory: 'packages/composite' },
  { name: '@ektro-mv/cli', directory: 'packages/cli' },
  { name: '@ektro-mv/mcp', directory: 'mcp/ektro-mv-mcp' },
];

assert(version && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version), '--version must be an exact semver');
assert(publish !== dryRun, 'choose exactly one of --publish or --dry-run');
if (publish) {
  assert(process.env.GITHUB_ACTIONS === 'true', 'real publication is restricted to GitHub Actions');
  assert(process.env.ACTIONS_ID_TOKEN_REQUEST_URL, 'GitHub OIDC is unavailable; id-token: write is required');
}

const packDirectory = await mkdtemp(resolve(tmpdir(), 'ektro-mv-release-'));

try {
  const artifacts = [];
  for (const spec of packages) {
    const sourceManifest = JSON.parse(await readFile(resolve(root, spec.directory, 'package.json'), 'utf8'));
    assert(sourceManifest.name === spec.name, `${spec.directory}: unexpected package name`);
    assert(sourceManifest.version === version, `${spec.name}: expected version ${version}, found ${sourceManifest.version}`);

    await execFile('pnpm', ['--filter', spec.name, 'pack', '--pack-destination', packDirectory], {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
    });
    const tarball = await findTarball(packDirectory, spec.name, version);
    const { stdout: manifestText } = await execFile('tar', ['-xOf', tarball, 'package/package.json']);
    const packedManifest = JSON.parse(manifestText);
    assert(packedManifest.name === spec.name && packedManifest.version === version, `${spec.name}: packed identity drifted`);
    assert(!manifestText.includes('workspace:'), `${spec.name}: workspace protocol leaked into release tarball`);

    const integrity = `sha512-${createHash('sha512').update(await readFile(tarball)).digest('base64')}`;
    const publishedIntegrity = await registryIntegrity(spec.name, version);
    if (publishedIntegrity) {
      assert(publishedIntegrity === integrity, `${spec.name}@${version}: registry integrity differs from local tarball`);
    }
    artifacts.push({ ...spec, tarball, integrity, published: Boolean(publishedIntegrity) });
  }

  for (const artifact of artifacts) {
    if (artifact.published) {
      process.stdout.write(`Already published with matching integrity: ${artifact.name}@${version}\n`);
      continue;
    }
    const args = ['publish', artifact.tarball, '--access', 'public'];
    if (dryRun) args.push('--dry-run', '--provenance=false');
    const { stdout, stderr } = await execFile('npm', args, {
      cwd: root,
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120_000,
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.stdout.write(`${dryRun ? 'Dry-run verified' : 'Published'}: ${artifact.name}@${version}\n`);
  }

  process.stdout.write(`${dryRun ? 'Dry-run verified' : 'Released'} ${artifacts.length} version-aligned packages.\n`);
} finally {
  await rm(packDirectory, { recursive: true, force: true });
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function findTarball(directory, packageName, packageVersion) {
  const expected = `${packageName.replace(/^@/, '').replace('/', '-')}-${packageVersion}.tgz`;
  const files = await readdir(directory);
  const filename = files.find((file) => file === expected);
  assert(filename, `${packageName}: pnpm pack did not create ${expected}`);
  return resolve(directory, filename);
}

async function registryIntegrity(packageName, packageVersion) {
  try {
    const { stdout } = await execFile('npm', ['view', `${packageName}@${packageVersion}`, 'dist.integrity', '--json'], {
      cwd: root,
      maxBuffer: 2 * 1024 * 1024,
      timeout: 30_000,
    });
    const value = JSON.parse(stdout || 'null');
    return typeof value === 'string' && value ? value : undefined;
  } catch (error) {
    const stderr = typeof error === 'object' && error !== null && 'stderr' in error ? String(error.stderr) : '';
    if (/E404|is not in this registry|No match found/i.test(stderr)) return undefined;
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
