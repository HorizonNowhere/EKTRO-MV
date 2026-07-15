---
name: ektro-mv
description: Create a complete music video from a single sentence or reviewed CreativeBrief with the EKTRO-MV MCP server. Use when the user asks to make an MV, music video, 神曲, or 一句话出片 and understands that generation may call paid external model APIs.
---

# EKTRO-MV — one sentence → a music video

EKTRO-MV is an open-source capability from [Ektro](https://ektroai.com/?utm_source=hermes_agent&utm_medium=integration&utm_campaign=ektro_mv&utm_content=skill). It composes a CreativeBrief, generates a vocal song through ACE-Step/ComfyUI, generates shots through Seedance, optionally aligns Whisper captions, and renders a delivery-ready MP4 with Remotion.

## Required sequence

1. Call `ektro_mv_doctor` before the first generation in a session.
2. Explain failed prerequisites. Do not attempt generation until required checks pass.
3. Tell the user that generation writes local files and may incur Anthropic/Volcengine charges.
4. Obtain an explicit user request to proceed. Only then set `confirmedExternalCalls: true`.
5. Call `ektro_mv_create` once. Do not retry a failed paid run automatically; report its `runId`, error code, and recovery option first.

## Read-only preflight

Call `ektro_mv_doctor` with:

- `useBrief`: true when a structured `brief` will be supplied, so Anthropic is not required.
- `includeSubtitles`: true only when captions are requested.

The doctor checks Node, credential presence, ComfyUI reachability, ffmpeg/ffprobe, and optional Whisper requirements. It never returns secret values.

## Create tool

Call `ektro_mv_create` with exactly one of:

- `prompt`: one sentence such as `做一首赛博朋克 AI 觉醒神曲`; or
- `brief`: a validated CreativeBrief object for a reviewed, deterministic plan.

Additional fields:

- `skipSubtitles`: defaults to true. Set false only after the doctor passes subtitle checks.
- `outputDir`: optional relative directory below `EKTRO_MV_OUTPUT_ROOT`. Absolute and escaping paths are rejected.
- `confirmedExternalCalls`: must be true and must reflect the user's explicit approval for external calls and possible cost.

The result is structured and includes `runId`, `workDir`, `outputMp4`, `briefTitle`, and `subtitles`.

## Install from a source checkout

Build the repository, export the required environment variables, then register the executable and its argument separately:

```bash
pnpm --filter @ektro-mv/mcp build
hermes mcp add ektro-mv \
  --command node \
  --args /absolute/path/to/EKTRO-MV/mcp/ektro-mv-mcp/dist/bin.js
hermes mcp test ektro-mv
```

After `@ektro-mv/mcp@0.2.0` is publicly released, use the pinned package:

```bash
hermes mcp add ektro-mv --command npx --args -y @ektro-mv/mcp@0.2.0
```

## CLI fallback

If MCP is unavailable but the user has authorized terminal execution:

```bash
ektro-mv "做一首赛博朋克 AI 觉醒神曲" --out mv.mp4 --skip-subtitles
```

## Boundaries

- Do not expose API keys, provider responses containing credentials, or private prompts in logs.
- Do not treat a tool timeout or lost client connection as proof that paid provider work stopped.
- Do not publish the generated MP4 without a separate explicit publishing request.
- Do not claim success until the returned file exists and the delivery check passes.
- EKTRO-MV creates no proprietary claim over user prompts or output media; provider terms still apply.
