# Upstream submission playbook

This file separates technically ready assets from external publication. Do not open a batch of promotional PRs. Submit one host-native contribution at a time after its release gate is satisfied, respond to maintainers, and use adoption evidence to decide the next target.

## Current readiness

| Target | Local asset | Current status | External blocker |
|---|---|---|---|
| MCP Registry | `mcp/ektro-mv-mcp/server.json` | Official schema validation passes | npm 0.2.0 must be public; Registry login/publish authorization |
| Hermes Agent | `hermes/optional-mcps/ektro-mv/manifest.yaml` | Manifest is at the exact intended upstream path | public package and one real render |
| OpenClaw | `openclaw/` | TypeScript build, official metadata check, plugin validation, and package-content check pass | public dependencies, verified ClawHub owner scope, one real render |
| goose | `goose/ektro-mv.yaml` | Local recipe is usable after npm release | upstream `servers.json` entry and tutorial need public package + tested example output |
| OpenCode | `mcp-clients.md` | Local config is ready | public package; then a small common-server docs PR |
| LibreChat | `librechat/librechat.example.yaml` | Docker-safe example is ready | real LibreChat connection test |
| Open WebUI / n8n / Dify / Langflow / Flowise | `http-hosts.md` | Secure HTTP transport and protocol tests pass | one real connection/template proof per host |

## Submission order

1. Publish the six version-aligned npm packages and verify a clean install.
2. Run one real MV generation and preserve the prompt/brief, doctor output, artifact paths, provider versions, duration, and final MP4 as release evidence.
3. Publish the MCP Registry record. This is the shared discovery primitive used by multiple clients.
4. Submit the Hermes catalog manifest, directly answering the maintainer's request to move the integration out of Hermes core.
5. Publish the OpenClaw package to the verified matching ClawHub owner.
6. Submit the lean goose catalog/tutorial pair and the OpenCode docs example.
7. Validate and publish workflow templates one host at a time, starting with n8n and Open WebUI.
8. Build a ComfyUI workflow/demo artifact. Add a custom node only after repeated demand proves the maintenance cost.

## Upstream copy rules

- Lead with the user capability and exact install command, not Ektro's company story.
- State prerequisites, local writes, external providers, possible cost, confirmation behavior, uninstall steps, and maintenance owner.
- Link to the EKTRO-MV repository as the primary source and support surface.
- Keep the full Ektro introduction in this repository. If upstream policy permits one origin link, label it plainly as “Built by Ektro”; never disguise an acquisition link as technical documentation.
- Do not auto-open a browser, add install callbacks, phone home, or watermark user output.
- Demo videos owned by the project may include an Ektro end card. User-generated videos may include branding only through an explicit opt-in option.

## Suggested first submissions

### Hermes Agent

Title:

```text
feat(optional-mcps): add EKTRO-MV music-video server
```

Body:

```text
Adds EKTRO-MV as a standalone optional MCP, following the in-tree provider policy discussed in #42844.

- Version-pinned npm stdio transport
- Read-only doctor tool before generation
- Explicit confirmation required for external model calls and possible cost
- Isolated local artifact directories
- No Hermes core code or maintenance dependency

Verification:
- clean npm install and MCP handshake
- doctor contract over stdio
- real end-to-end render: <release evidence URL>
```

The PR should contain only `optional-mcps/ektro-mv/manifest.yaml` unless maintainers request more.

### OpenClaw

Do not open a core-repository PR. Publish the plugin through the matching ClawHub owner, because OpenClaw documents ClawHub as the primary community discovery surface. Keep `ektro_mv_create` optional and require explicit tool allowlisting plus the tool-level confirmation field.

### goose

Follow goose's own contribution recipe: one alphabetical `servers.json` entry and one lean tutorial based on its template. Include one useful prompt/output, not a broad feature list. The tutorial should link back to changing provider/setup details in EKTRO-MV rather than copying them.

### OpenCode

Submit one “common MCP server” example with the version-pinned local command and a note to run doctor first. Do not include the broader market narrative in the OpenCode docs PR.

## Host-specific attribution

Use these values only on EKTRO-MV-owned pages or where upstream policy explicitly permits an origin link:

| Host | `utm_source` | Recommended `utm_content` |
|---|---|---|
| Hermes Agent | `hermes_agent` | `catalog` |
| OpenClaw | `openclaw` | `clawhub_plugin` |
| goose | `goose` | `mcp_tutorial` |
| n8n | `n8n` | `workflow_template` |
| Open WebUI | `open_webui` | `external_tool_guide` |
| Dify | `dify` | `mcp_guide` |
| Langflow | `langflow` | `flow_template` |
| Flowise | `flowise` | `chatflow_template` |
| LibreChat | `librechat` | `mcp_config` |
| OpenCode | `opencode` | `mcp_docs` |
| Gemini CLI | `gemini_cli` | `mcp_config` |
| Qwen Code | `qwen_code` | `mcp_extension` |
| Cline | `cline` | `marketplace` |
| Continue | `continue` | `cookbook` |
| ComfyUI | `comfyui` | `workflow_demo` |

The final URL shape is:

```text
https://ektroai.com/?utm_source=<source>&utm_medium=integration&utm_campaign=ektro_mv&utm_content=<content>
```

The website should preserve these parameters into the signup/first-action funnel. EKTRO-MV itself remains telemetry-free.
