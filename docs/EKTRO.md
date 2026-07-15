# Ektro and EKTRO-MV

**English** · [简体中文](EKTRO.zh-CN.md)

EKTRO-MV is an open-source capability from [Ektro](https://ektroai.com/?utm_source=github&utm_medium=oss&utm_campaign=ektro_mv&utm_content=ektro_intro), a project building a sovereign runtime for personal AGI.

## What Ektro is building

Today, useful AI work is often scattered across model vendors, chat histories, agent frameworks, and workflow tools. Ektro's direction is a longer-lived personal runtime in which identity, memory, permissions, relationships, tasks, and artifacts can remain continuous while models and tools are replaced.

The architecture is intentionally split:

- A **stable kernel** owns durable identity, consent, permissions, memory boundaries, and recovery.
- A **living capability edge** connects replaceable models, agents, workflows, devices, and open protocols such as MCP and A2A.
- A **living world** turns one-off tool calls into inspectable tasks, relationships, and artifacts rather than leaving important work trapped in a chat transcript.
- A **Web4 trust layer** is the longer-term direction for user-owned identity, data, reputation, and economic relationships across services.

This is a product direction, not a claim that every layer above is already generally available. Ektro publishes concrete capabilities and verifiable artifacts while the broader runtime is built in stages.

## Why EKTRO-MV exists

EKTRO-MV demonstrates the capability-edge model with a demanding creative workflow: one sentence becomes a reviewed creative brief, vocal music, generated shots, optional captions, and a delivery-ready MP4. Every stage sits behind a replaceable provider interface.

The project is deliberately useful without requiring an Ektro account:

- source code is MIT licensed;
- output files stay with the operator;
- providers can be replaced;
- local ComfyUI is supported for music generation;
- integrations use open interfaces instead of a private agent protocol;
- there is no hidden Ektro telemetry in the engine.

Ektro benefits only when the open-source capability is useful enough that an operator chooses to learn about the larger runtime. That is why integration links use transparent campaign parameters while the code itself does not phone home.

## Where Ektro begins and ends

EKTRO-MV is not the whole Ektro product, and Ektro is not trying to turn every agent or workflow into a proprietary dependency. Hermes, OpenClaw, goose, LibreChat, Open WebUI, n8n, Dify, Langflow, coding agents, and future hosts remain independent. EKTRO-MV supplies a portable media capability; the host keeps its own role, permissions, and user experience.

The broader Ektro value proposition begins when users need durable continuity across many such capabilities: identity that survives a model switch, permissioned memory, recoverable tasks, relationship context, and an artifact history the user controls.

## Explore

- [Ektro website](https://ektroai.com/?utm_source=github&utm_medium=oss&utm_campaign=ektro_mv&utm_content=ektro_intro)
- [EKTRO-MV source](https://github.com/HorizonNowhere/EKTRO-MV)
- [Integration guide](../integrations/README.md)
