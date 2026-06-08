import { describe, it, expect } from 'vitest';
import { parseSrt } from '../src/srt.js';

const SRT = `1
00:00:01,000 --> 00:00:03,500
hello world

2
00:00:04,000 --> 00:00:06,000
second line
`;

describe('parseSrt', () => {
  it('parses cues into {startMs,endMs,text}', () => {
    const caps = parseSrt(SRT);
    expect(caps).toHaveLength(2);
    expect(caps[0]).toEqual({ startMs: 1000, endMs: 3500, text: 'hello world' });
    expect(caps[1].startMs).toBe(4000);
  });
  it('returns [] for empty input', () => {
    expect(parseSrt('')).toEqual([]);
  });
  it('joins multi-line cue text with a space', () => {
    const caps = parseSrt('1\n00:00:00,000 --> 00:00:01,000\nline a\nline b\n');
    expect(caps[0].text).toBe('line a line b');
  });
});
