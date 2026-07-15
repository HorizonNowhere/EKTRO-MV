import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/args.js';

describe('parseArgs', () => {
  it('captures the one-liner and flags', () => {
    const a = parseArgs(['make a cyberpunk anthem', '--out', 'mv.mp4', '--workdir', './w']);
    expect(a.oneLiner).toBe('make a cyberpunk anthem');
    expect(a.out).toBe('mv.mp4');
    expect(a.workDir).toBe('./w');
  });
  it('sets help when -h present and tolerates missing one-liner', () => {
    expect(parseArgs(['-h']).help).toBe(true);
    expect(parseArgs([]).oneLiner).toBe('');
  });
  it('keeps subtitles off by default and supports explicit opt-in', () => {
    const a = parseArgs(['--brief', 'b.json']);
    expect(a.brief).toBe('b.json');
    expect(a.subtitles).toBe(false);
    expect(a.oneLiner).toBe('');
    expect(parseArgs(['x', '--subtitles']).subtitles).toBe(true);
    expect(parseArgs(['x', '--subtitles', '--skip-subtitles']).subtitles).toBe(false);
  });
});
