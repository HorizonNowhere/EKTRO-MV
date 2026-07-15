# Ecosystem integration and distribution strategy

Last researched: 2026-07-15. Star counts are a directional snapshot from the GitHub API, not a product-quality ranking.

## Decision

Use a standards-first distribution model:

1. Publish a version-pinned npm package and official MCP Registry record.
2. Offer both stdio and secure local Streamable HTTP transports.
3. Build a native plugin only where the host does not expose a sufficient MCP path (OpenClaw).
4. Submit small, host-native catalog or documentation contributions after the public package and a real render pass, except where a maintainer has already directed EKTRO-MV to an out-of-tree distribution path.
5. Keep the complete Ektro story in this repository and linked assets. Upstream submissions stay instructional and avoid promotional copy.

This produces more adoption with less permanent maintenance than copying the same integration into many upstream cores.

## Prioritized landscape

| Priority | Project | Stars snapshot | Official integration surface | Best adoption asset | Upstream action after release |
|---|---|---:|---|---|---|
| P0 | [OpenClaw](https://github.com/openclaw/openclaw) | 382.9k | Native TypeScript tool plugin + ClawHub | Native plugin with read-only doctor and optional create tool | Publish on ClawHub; no core PR |
| P0 | [Hermes Agent](https://github.com/NousResearch/hermes-agent) | 214.9k | External MCP setup or standalone plugin | Version-pinned setup maintained in EKTRO-MV | Honor the decision on #42844; no repeat core/catalog PR unless Nous requests one |
| P0 | [n8n](https://github.com/n8n-io/n8n) | 196.5k | MCP Client Tool and Registry client | Registry listing + HTTP setup + reviewed workflow template | Publish workflow template after real run |
| P0 | [OpenCode](https://github.com/anomalyco/opencode) | 185.9k | Local/remote MCP + common-server docs | Copyable config and focused docs example | Docs PR after npm release |
| P0 | [Langflow](https://github.com/langflow-ai/langflow) | 151.9k | MCP client component | HTTP/stdio import instructions and flow demo | Publish a verified template |
| P0 | [Dify](https://github.com/langgenius/dify) | 148.8k | MCP tools + reviewed plugin marketplace | HTTP MCP guide first | Marketplace plugin only if MCP listing is insufficient |
| P0 | [Open WebUI](https://github.com/open-webui/open-webui) | 145.4k | Streamable HTTP External Tools | Secure local HTTP endpoint guide | Docs/community listing after real run |
| P0 | [Official MCP Registry](https://github.com/modelcontextprotocol/registry) | Standard | `server.json` + npm ownership marker | `io.github.horizonnowhere/ektro-mv` | Publish after npm 0.2.0 exists |
| P1 | [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | 120.7k | Workflow and custom-node ecosystem | Reproducible ACE-Step workflow/demo artifact | Custom node only after demand signal |
| P1 | [Gemini CLI](https://github.com/google-gemini/gemini-cli) | 106.0k | stdio/HTTP MCP | Settings snippet and one-command setup | Community docs/listing if invited |
| P1 | [Qwen Code](https://github.com/QwenLM/qwen-code) | 26.0k | stdio/HTTP MCP and extensions | Settings snippet, then extension bundle | Extension repository after public package |
| P1 | [goose](https://github.com/aaif-goose/goose) | 51.2k | MCP catalog, tutorials, recipes | Recipe now; lean server/tutorial submission later | `servers.json` + one instructional tutorial |
| P1 | [LibreChat](https://github.com/danny-avila/LibreChat) | 40.7k | stdio/Streamable HTTP MCP | Docker-safe HTTP config | Community docs only after verification |
| P1 | [Flowise](https://github.com/FlowiseAI/Flowise) | 54.6k | MCP client/server nodes | HTTP MCP chatflow template | Publish verified marketplace/template asset |
| P1 | [Cline](https://github.com/cline/cline) | 64.7k | stdio/HTTP MCP and marketplace | Registry-backed install guide | Marketplace submission after release |
| P1 | [Continue](https://github.com/continuedev/continue) | 34.9k | MCP config and cookbook | Copyable config + creative automation cookbook | Cookbook PR after release |
| P2 | [OpenHands](https://github.com/OpenHands/OpenHands), [AutoGen](https://github.com/microsoft/autogen), [CrewAI](https://github.com/crewAIInc/crewAI), [LangGraph](https://github.com/langchain-ai/langgraph), [Agno](https://github.com/agno-agi/agno) | 37k–81k | Framework adapters and examples | One standards-based tutorial per proven use case | Do not add a core adapter without usage evidence |

## Why the acquisition mechanism differs by ecosystem

- **Agent catalogs (goose, Cline):** catalog presence is the conversion surface. The upstream entry should explain the capability, prerequisites, cost boundary, and one example. The repository carries the broader Ektro narrative.
- **Hermes Agent:** its general documentation permits reviewed `optional-mcps` entries, but the maintainer closed EKTRO-MV PR #42844 under the in-tree provider-integration policy and explicitly requested a standalone plugin or MCP setup distributed through EKTRO-MV. That project-specific decision takes precedence; do not resubmit the same catalog change.
- **Plugin marketplaces (OpenClaw, Dify):** installability, permissions, maintenance ownership, screenshots, and a tested package matter more than prose. A native OpenClaw plugin is justified because it is the host's preferred extension boundary.
- **MCP-native clients (OpenCode, Gemini CLI, Qwen Code, Continue):** a registry record and a copyable, version-pinned config maximize reach. A separate plugin would fragment updates.
- **Self-hosted web/workflow products (Open WebUI, LibreChat, n8n, Langflow, Flowise):** Streamable HTTP avoids trying to run GPU/local dependencies inside the host container. Templates should preserve human approval before `ektro_mv_create`.
- **Creator ecosystems (ComfyUI):** a visible, reproducible output workflow earns more adoption than a generic marketing integration. A custom node is deferred until repeated use proves that maintaining it is worthwhile.
- **Agent frameworks:** examples should demonstrate orchestration value and remain framework-local. Core framework PRs are inappropriate for a single application server.

## Attribution without surveillance

Every ecosystem asset may link to Ektro with transparent UTM parameters:

```text
https://ektroai.com/?utm_source=<ecosystem>&utm_medium=integration&utm_campaign=ektro_mv&utm_content=<asset>
```

Measure the funnel on the website, not inside EKTRO-MV:

`external integration → Ektro landing → first meaningful action → first verified outcome → retained user`

Do not add hidden telemetry, fingerprinting, install callbacks, or automatic browser opens. Repository clicks, package downloads, catalog installs, template imports, and opted-in website analytics are sufficient acquisition signals.

## Release gates before upstream submissions

- `@ektro-mv/mcp@0.2.0` and its internal dependencies are publicly installable.
- The official MCP Registry metadata validates and package ownership verification succeeds.
- A clean machine can install the packages, connect over stdio and Streamable HTTP, run `ektro_mv_doctor`, and resolve the Remotion entry.
- At least one real end-to-end MV renders successfully with current providers.
- Each upstream asset has host-specific install and uninstall steps, exact cost/side-effect disclosure, no secrets, and a named maintenance owner.
- Links use host-specific attribution; upstream copy remains instructional.

## Surfaces that should not receive a product-specific core PR

Open WebUI, LibreChat, n8n, Langflow, Flowise, Gemini CLI, Qwen Code, OpenCode, Continue, and similar MCP-native hosts already expose a standards-based connection surface. For these projects, publish through the official MCP Registry and maintain host-specific configuration or templates in EKTRO-MV. Open a host documentation or template contribution only after a real connection has been reproduced and the project explicitly accepts that artifact type. Do not duplicate the MCP server as a permanent core integration merely to gain a directory link.

## Primary documentation used

- [MCP Registry publishing quickstart](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx)
- [Hermes MCP integration](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/mcp.md)
- [OpenClaw plugin guide](https://github.com/openclaw/openclaw/blob/main/docs/plugins/building-plugins.md) and [ClawHub publishing](https://github.com/openclaw/openclaw/blob/main/docs/clawhub/publishing.md)
- [goose MCP contribution recipe](https://github.com/aaif-goose/goose/blob/main/documentation/src/pages/recipes/data/recipes/add-mcp-server.yaml)
- [Open WebUI MCP guide](https://docs.openwebui.com/features/extensibility/mcp/)
- [LibreChat MCP guide](https://www.librechat.ai/en/docs/features/mcp)
- [Langflow MCP client](https://docs.langflow.org/mcp-client)
- [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers)
- [Gemini CLI MCP setup](https://geminicli.com/docs/cli/tutorials/mcp-setup/)
- [Qwen Code MCP setup](https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/)
- [Dify Marketplace release process](https://docs.dify.ai/en/develop-plugin/publishing/marketplace-listing/release-overview)
