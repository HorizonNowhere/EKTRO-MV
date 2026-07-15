import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['README.md', 'README.zh-CN.md'],
  ['docs/EKTRO.md', 'docs/EKTRO.zh-CN.md'],
  ['integrations/README.md', 'integrations/README.zh-CN.md'],
];

for (const [englishPath, chinesePath] of pairs) {
  const [english, chinese] = await Promise.all([read(englishPath), read(chinesePath)]);
  assert(english.includes(chinesePath.split('/').at(-1)), `${englishPath}: missing link to ${chinesePath}`);
  assert(chinese.includes(englishPath.split('/').at(-1)), `${chinesePath}: missing link to ${englishPath}`);
}

const [englishReadme, chineseReadme, mcpReadme, openClawReadme] = await Promise.all([
  read('README.md'),
  read('README.zh-CN.md'),
  read('mcp/ektro-mv-mcp/README.md'),
  read('integrations/openclaw/README.md'),
]);

for (const [path, contents] of [
  ['README.md', englishReadme],
  ['README.zh-CN.md', chineseReadme],
]) {
  for (const marker of ['@ektro-mv/mcp@0.2.0', 'ektro_mv_doctor', 'ektro_mv_create', 'Streamable HTTP']) {
    assert(contents.includes(marker), `${path}: missing release-critical marker ${marker}`);
  }
}

assert(englishReadme.includes('## Provider portability'), 'README.md: missing provider portability guidance');
assert(chineseReadme.includes('## 服务商可替换'), 'README.zh-CN.md: missing provider portability guidance');
assert(!englishReadme.includes('中文简介'), 'README.md: must link to the Chinese README instead of embedding a second-language introduction');
assert(!englishReadme.includes('一句话 → 一支完整 MV'), 'README.md: front-page copy must stay English-only');
assert(!chineseReadme.includes('One sentence → a music video'), 'README.zh-CN.md: front-page copy must stay Chinese-only');
for (const [path, contents, forbidden] of [
  ['README.md', englishReadme, ['China and international users', 'Chinese operators', 'International operators']],
  ['README.zh-CN.md', chineseReadme, ['中国用户与国际用户', '中国用户注意事项', '国际用户注意事项']],
]) {
  for (const marker of forbidden) {
    assert(!contents.includes(marker), `${path}: audience-segmentation label must not return: ${marker}`);
  }
}
assert(mcpReadme.includes('## English') && mcpReadme.includes('## 简体中文'), 'MCP package README must be bilingual');
assert(openClawReadme.includes('## 简体中文'), 'OpenClaw README: missing Chinese-language section');

const markdownFiles = await collectMarkdown(root);
let attributedLinks = 0;
let localLinks = 0;
for (const absolutePath of markdownFiles) {
  const contents = await readFile(absolutePath, 'utf8');
  const links = contents.matchAll(/\]\((https:\/\/ektroai\.com\/\?[^)\s]+)\)/g);
  for (const match of links) {
    attributedLinks += 1;
    const url = new URL(match[1]);
    for (const parameter of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      assert(url.searchParams.get(parameter), `${relative(root, absolutePath)}: Ektro link missing ${parameter}`);
    }
    assert(url.searchParams.get('utm_campaign') === 'ektro_mv', `${relative(root, absolutePath)}: unexpected UTM campaign`);
  }
  assert(!contents.includes('](https://ektroai.com)'), `${relative(root, absolutePath)}: unattributed Ektro link`);

  for (const match of contents.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = decodeURIComponent(match[1].split('#')[0]);
    if (!target || target.includes('<') || target.includes('>')) continue;
    const resolved = resolve(dirname(absolutePath), target);
    assert(await exists(resolved), `${relative(root, absolutePath)}: broken local link ${match[1]}`);
    localLinks += 1;
  }
}
assert(attributedLinks >= 10, `expected at least 10 attributed Ektro links, found ${attributedLinks}`);

process.stdout.write(`Verified ${pairs.length} bilingual doc pairs, ${localLinks} local links, and ${attributedLinks} attributed Ektro links.\n`);

async function read(path) {
  return readFile(resolve(root, path), 'utf8');
}

async function collectMarkdown(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collectMarkdown(absolutePath));
    else if (extname(entry.name) === '.md') result.push(absolutePath);
  }
  return result;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
