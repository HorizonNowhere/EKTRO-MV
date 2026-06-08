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
never be committed. Do not paste real keys into issues, PRs, or logs.

## Output media

Rendered MP4s may embed prompts you provided. Review generated content before publishing,
especially when sharing model output publicly.
