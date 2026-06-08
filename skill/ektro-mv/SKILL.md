---
name: ektro-mv
description: Create a complete music video from a single sentence — EKTRO-MV writes the song (lyrics + vocals), generates video, aligns subtitles, and renders a finished MP4. Use when the user asks to "make an MV / music video / 神曲 / 一句话出片" from a short description.
---

# EKTRO-MV — one sentence → a music video

EKTRO-MV turns one sentence into a finished music video: an LLM writes the song and shotlist, ACE-Step sings it, Seedance generates the visuals, Whisper aligns captions, and Remotion renders the final MP4.

## Preferred: via MCP

If the EKTRO-MV MCP server is registered, call the `ektro_mv_create` tool:
- `prompt` (required): one sentence, e.g. "做一首赛博朋克 AI 觉醒神曲".
- `workDir` (optional): output directory.

It returns the path to the rendered MP4.

To register the server (one-time):
```bash
hermes mcp add ektro-mv --command "node /path/to/EKTRO-MV/mcp/ektro-mv-mcp/dist/bin.js"
```

## Fallback: via CLI

```bash
ektro-mv "做一首赛博朋克 AI 觉醒神曲" --out mv.mp4
```

## Prerequisites (tell the user if missing)
- `ANTHROPIC_API_KEY` (song + shotlist), `ARK_API_KEY` (Seedance video).
- ComfyUI running with ACE-Step (local, GPU) for the vocal song.
- `ffmpeg`/`ffprobe` on PATH; a local whisper.cpp install dir for captions.
- Generation takes several minutes; the music stage needs a GPU.

## Notes
- The output MP4 targets H.264 / yuv420p / AAC for broad platform compatibility.
- This skill drives the open-source EKTRO-MV engine; it creates NO proprietary content itself.
