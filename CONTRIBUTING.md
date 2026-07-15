# Contributing to EKTRO-MV

Thanks for your interest! EKTRO-MV is an open-source engine that turns one sentence
into a finished music video. Contributions — new providers, bug fixes, docs — are welcome.

## Development setup

```bash
pnpm install
pnpm build
pnpm lint
pnpm test          # all unit tests (fully mock-backed, no GPU/keys/network needed)
pnpm typecheck
pnpm verify:docs   # bilingual entry points, release markers, and attributed Ektro links
pnpm verify:integrations # host manifests, safety gates, versions, and upstream-neutral copy
pnpm verify:packages
pnpm verify:deploy # packs/installs release tarballs, then exercises stdio + HTTP MCP
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
- Ensure `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm verify:packages`, and `pnpm verify:deploy` all pass.
- Conventional commit subjects: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Documentation and localization

- `README.md` is the canonical English entry point and must retain a concise Chinese introduction.
- `README.zh-CN.md` is the complete Simplified Chinese entry point. User-visible capabilities, versions, install commands, safety boundaries, and integration links must be updated in both files.
- Keep the English and Chinese Ektro introductions (`docs/EKTRO*.md`) and integration indexes (`integrations/README*.md`) mutually linked.
- Upstream catalog manifests and PR copy follow each host project's preferred language and style; do not duplicate the full Ektro narrative into upstream repositories.
- Ektro links in project-owned Markdown must use transparent `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` parameters. Do not add hidden telemetry as a substitute for link attribution.

## Security

Never commit API keys, tokens, or private content. See [SECURITY.md](SECURITY.md).

## Releases

Do not publish from a developer laptop. Follow the protected, provenance-preserving process in [RELEASING.md](RELEASING.md).

## License

By contributing, you agree your contributions are licensed under the MIT License.
