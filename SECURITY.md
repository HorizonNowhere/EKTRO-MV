# Security Policy

## Reporting a vulnerability

If you discover a security issue, please report it privately via GitHub Security Advisories
("Report a vulnerability" on the repository's **Security** tab) rather than opening a public issue.
We aim to acknowledge reports within a few days.

## Handling secrets

EKTRO-MV never stores credentials in code. All keys are read from environment variables
at runtime:

- `ANTHROPIC_API_KEY` — the brain (song + shotlist)
- `ARK_API_KEY` — Seedance video generation

Copy `.env.example` to `.env` and fill it in locally. `.env` is git-ignored and must
never be committed. EKTRO-MV does not load it implicitly; export it explicitly or use
your MCP host's secret store. Do not paste real keys into issues, PRs, or logs.

The stdio MCP transport reserves stdout for JSON-RPC. Runtime progress and diagnostics
go to stderr, and known API-key values are redacted from surfaced generation errors.

## External calls and filesystem access

Prompt mode calls Anthropic, video generation calls Volcengine Ark, and music generation
contacts the configured ComfyUI instance. These services may process prompt or media data
and may incur charges. The MCP create tool requires an explicit confirmation flag before
starting these calls; hosts should obtain that confirmation from the user, not infer it.

MCP outputs are isolated below `EKTRO_MV_OUTPUT_ROOT`. A caller-provided `outputDir` must
be relative and cannot escape that root. Treat generated media as untrusted until it has
been reviewed.

## Output media

Rendered MP4s may embed prompts or media supplied by external providers. Review generated
content, licensing, and provider terms before publishing it.
