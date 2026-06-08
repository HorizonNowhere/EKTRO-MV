# Contributing to EKTRO-MV

Thanks for your interest! EKTRO-MV is an open-source engine that turns one sentence
into a finished music video. Contributions — new providers, bug fixes, docs — are welcome.

## Development setup

```bash
pnpm install
pnpm -r build
pnpm test          # all unit tests (fully mock-backed, no GPU/keys/network needed)
pnpm -r typecheck
```

Requirements: Node 20+, pnpm 10+. Running the full pipeline (not the tests) additionally
needs ComfyUI + ACE-Step (GPU), ffmpeg/ffprobe, and API keys — see the README.

## Architecture in one minute

- `@ektro-mv/core` — shared types, the `CreativeBrief` schema, the five provider
  **interfaces**, the generic `runPipeline`, and the Anthropic brain.
- `@ektro-mv/providers` — the default media providers (Seedance / ACE-Step / Whisper).
- `@ektro-mv/composite` — SRT parser, ffprobe delivery gate, Remotion composite.
- `@ektro-mv/cli` — `runMv` orchestrator + the `ektro-mv` binary.
- `apps/remotion` — the `MusicVideo` composition.
- `mcp/ektro-mv-mcp` + `skill/ektro-mv` — HERMES integration.

**The provider interfaces are the single extension seam.** To add a backend, implement the
relevant interface and inject it — don't fork the orchestrator.

## Adding a provider (example)

1. Implement the interface from `@ektro-mv/core` (e.g. `MusicProvider`).
2. Accept dependencies (HTTP client, file I/O) via the constructor so it's unit-testable
   without real network/GPU — mirror the existing providers.
3. Write a mock-backed unit test that injects fakes.
4. Wire it into `defaultMediaProviders` (or document how to select it).

## Coding standards

- TypeScript strict, ESM with explicit `.js` import extensions (NodeNext).
- TDD: write the failing test first, then the minimal implementation.
- Small, focused files; keep one clear responsibility per module.
- No secrets in code — credentials come from environment variables only.

## Pull requests

- Keep PRs focused; one logical change per PR.
- Ensure `pnpm test`, `pnpm -r typecheck`, and `pnpm -r build` all pass.
- Conventional commit subjects: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Security

Never commit API keys, tokens, or private content. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contributions are licensed under the MIT License.
