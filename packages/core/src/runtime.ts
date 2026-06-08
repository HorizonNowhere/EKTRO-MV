import type { Step, RunContext } from './providers.js';

export interface PipelineConfig<State> {
  name: string;
  workDir: string;
  initialState: State;
  steps: Step<State>[];
}

export async function runPipeline<State>(cfg: PipelineConfig<State>): Promise<State> {
  const state = cfg.initialState;
  const base: RunContext = {
    workDir: cfg.workDir,
    log: (msg, extra) =>
      console.log(`[${cfg.name}] ${msg}`, extra === undefined ? '' : extra),
  };
  for (const step of cfg.steps) {
    const ctx = { ...base, state };
    if (step.skip?.(ctx)) {
      base.log(`skip: ${step.name}`);
      continue;
    }
    base.log(`run: ${step.name}`);
    await step.run(ctx);
  }
  return state;
}
