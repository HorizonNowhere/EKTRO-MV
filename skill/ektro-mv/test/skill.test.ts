import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(resolve(here, '../SKILL.md'), 'utf8');

describe('SKILL.md', () => {
  it('has YAML frontmatter with name and description', () => {
    const m = md.match(/^---\n([\s\S]*?)\n---/);
    expect(m).toBeTruthy();
    const fm = m![1];
    expect(fm).toMatch(/^name:\s*ektro-mv\s*$/m);
    expect(fm).toMatch(/^description:\s*.+/m);
  });
  it('documents the MCP tool name and CLI fallback', () => {
    expect(md).toMatch(/ektro_mv_create/);
    expect(md).toMatch(/hermes mcp add/);
    expect(md).toMatch(/ektro-mv "/);
  });
});
