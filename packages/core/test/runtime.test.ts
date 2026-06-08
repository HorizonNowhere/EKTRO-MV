import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/runtime.js';
import type { Step } from '../src/providers.js';

interface S { trail: string[] }

describe('runPipeline', () => {
  it('runs steps in order and threads state', async () => {
    const a: Step<S> = { name: 'a', run: (c) => { c.state.trail.push('a'); } };
    const b: Step<S> = { name: 'b', run: (c) => { c.state.trail.push('b'); } };
    const out = await runPipeline<S>({ name: 'p', workDir: '/tmp', initialState: { trail: [] }, steps: [a, b] });
    expect(out.trail).toEqual(['a', 'b']);
  });

  it('honors skip predicate', async () => {
    const a: Step<S> = { name: 'a', skip: () => true, run: (c) => { c.state.trail.push('a'); } };
    const b: Step<S> = { name: 'b', run: (c) => { c.state.trail.push('b'); } };
    const out = await runPipeline<S>({ name: 'p', workDir: '/tmp', initialState: { trail: [] }, steps: [a, b] });
    expect(out.trail).toEqual(['b']);
  });
});
