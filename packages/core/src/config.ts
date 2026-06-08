export interface EktroConfig {
  brain: { apiKey: string; baseURL?: string; model: string };
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env): EktroConfig {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('loadConfig: ANTHROPIC_API_KEY is required (see .env.example)');
  }
  return {
    brain: {
      apiKey,
      baseURL: env.ANTHROPIC_BASE_URL || undefined,
      model: env.EKTRO_BRAIN_MODEL || 'claude-sonnet-4-20250514',
    },
  };
}
