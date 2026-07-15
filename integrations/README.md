# EKTRO-MV integrations

**English** · [简体中文](README.zh-CN.md)

EKTRO-MV exposes the same two tools across hosts:

- `ektro_mv_doctor`: read-only prerequisite check.
- `ektro_mv_create`: writes local artifacts and may call paid model APIs; it requires `confirmedExternalCalls: true`.

Use stdio when the host runs on the same machine and can start `npx`. Use Streamable HTTP when the host runs in Docker, on another machine, or only accepts network MCP servers.

| Host family | Asset | Recommended transport |
|---|---|---|
| Hermes Agent | [`hermes/optional-mcps/ektro-mv/manifest.yaml`](hermes/optional-mcps/ektro-mv/manifest.yaml) | stdio |
| OpenClaw | [`openclaw/`](openclaw/) | native tool plugin |
| goose | [`goose/ektro-mv.yaml`](goose/ektro-mv.yaml) | stdio recipe |
| LibreChat | [`librechat/librechat.example.yaml`](librechat/librechat.example.yaml) | HTTP for Docker; stdio otherwise |
| Open WebUI, n8n, Dify, Langflow, Flowise | [`http-hosts.md`](http-hosts.md) | Streamable HTTP |
| Gemini CLI, Qwen Code, OpenCode and similar clients | [`mcp-clients.md`](mcp-clients.md) | stdio |

The native OpenClaw package is separate from the pnpm workspace because OpenClaw has a stricter Node support window and a large host SDK. It must be built and validated on an OpenClaw-supported Node version before publication.

See [the ecosystem strategy](../docs/ecosystem-integration-strategy.md) for target selection, [the upstream submission playbook](upstream-submissions.md) for release order and PR scope, and [Ektro's full introduction](../docs/EKTRO.md) for the relationship between this capability and the broader runtime.
