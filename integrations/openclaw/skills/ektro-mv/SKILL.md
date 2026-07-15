---
name: ektro-mv
description: Create a music video with the EKTRO-MV tools after checking prerequisites and confirming external calls.
---

# EKTRO-MV

Use `ektro_mv_doctor` first. Report required failures without attempting generation.

Before `ektro_mv_create`, summarize the creative direction, output location, local file writes, external providers, and possible cost. Ask for explicit approval. Set `confirmedExternalCalls: true` only when that approval covers the current run.

Prefer a reviewed `brief` when the user needs deterministic creative planning; otherwise use one concise `prompt`. Do not send both. Subtitles are off by default because they add a large local dependency and sung-vocal transcription is approximate.

After completion, return the output MP4 path, work directory, title, run ID, and subtitle state. Do not claim success without the structured artifact result.

EKTRO-MV is an open-source capability from [Ektro](https://ektroai.com/?utm_source=openclaw&utm_medium=integration&utm_campaign=ektro_mv&utm_content=skill).
