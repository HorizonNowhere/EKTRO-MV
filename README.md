# EKTRO-MV

> One sentence → a music video.

Open-source AI music-video engine + CLI. Type one line, get a finished MV:
LLM writes the song & shotlist, ACE-Step sings it, Seedance shoots it,
Whisper captions it, Remotion cuts it.

## Architecture

```
Brain (Anthropic Claude)
  │  creative brief
  ▼
Music (ACE-Step / ComfyUI)  ──── audio.flac
  │
  ├─── Video (Seedance)  ──────── clip.mp4
  │
  ├─── Subtitle (Whisper) ─────── captions.srt
  │
  └─→  Composite (Remotion) ───── ektro-mv.mp4
```

## Hard Prerequisites

- **Node 20+** and **pnpm 10+**
- **ComfyUI** with the ACE-Step node (GPU required for music generation)
- **ffmpeg** and **ffprobe** on `PATH` (or set `FFMPEG_PATH` / `FFPROBE_PATH` env vars)
- **ANTHROPIC_API_KEY** — Claude API key
- **ARK_API_KEY** — Volcengine Ark key for Seedance video generation

## Install

```bash
pnpm install
```

## Env Setup

```bash
cp .env.example .env
# then fill in values: ANTHROPIC_API_KEY, ARK_API_KEY, COMFYUI_URL, EKTRO_WHISPER_INSTALL_DIR
```

## Usage

```bash
# build the CLI first
pnpm --filter @ektro-mv/cli build

# generate a music video
node packages/cli/dist/bin.js "做一首赛博朋克 AI 觉醒神曲"

# or with output path
node packages/cli/dist/bin.js "make a cyberpunk anthem" --out mv.mp4 --workdir ./out
```

## Development

```bash
# run all tests
pnpm test

# typecheck all packages
pnpm -r typecheck

# build all packages
pnpm -r build
```

## Package Structure

| Package | Role |
|---|---|
| `packages/core` | Types, interfaces, config, Anthropic brain provider |
| `packages/providers` | Seedance video, ACE-Step music, Whisper subtitle |
| `packages/composite` | SRT parser, delivery gate, Remotion composite provider |
| `packages/cli` | `runMv` orchestrator + `ektro-mv` bin |
| `apps/remotion` | Remotion `MusicVideo` composition (looped video + song + captions) |

## License
MIT
