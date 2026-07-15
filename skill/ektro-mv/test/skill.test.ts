import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(resolve(here, '../SKILL.md'), 'utf8');
const manifestPath = resolve(here, '../../../integrations/hermes/optional-mcps/ektro-mv/manifest.yaml');
const manifest = readFileSync(manifestPath, 'utf8');

describe('SKILL.md', () => {
  it('has YAML frontmatter with name and description', () => {
    const m = md.match(/^---\n([\s\S]*?)\n---/);
    expect(m).toBeTruthy();
    const fm = m![1];
    expect(fm).toMatch(/^name:\s*ektro-mv\s*$/m);
    expect(fm).toMatch(/^description:\s*.+/m);
  });
  it('documents the safe Hermes MCP flow and CLI fallback', () => {
    expect(md).toMatch(/ektro_mv_create/);
    expect(md).toMatch(/ektro_mv_doctor/);
    expect(md).toMatch(/confirmedExternalCalls/);
    expect(md).toMatch(/hermes mcp add/);
    expect(md).toMatch(/--command node/);
    expect(md).toMatch(/--args \/absolute\/path/);
    expect(md).toMatch(/ektro-mv "/);
  });
  it('pins the future Hermes catalog transport to the public MCP release', () => {
    expect(manifestPath).toMatch(/optional-mcps\/ektro-mv\/manifest\.yaml$/);
    expect(manifest).toMatch(/command:\s*npx/);
    expect(manifest).toMatch(/@ektro-mv\/mcp@0\.2\.0/);
    expect(manifest).toMatch(/ektro_mv_doctor/);
    expect(manifest).toMatch(/ektro_mv_create/);
  });
});
