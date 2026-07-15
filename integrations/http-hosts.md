# Connect HTTP-only and containerized hosts

EKTRO-MV includes a stateless Streamable HTTP MCP endpoint for Open WebUI, n8n, Dify, Langflow, Flowise, Dockerized LibreChat, and other hosts that cannot start a local stdio process.

## Start safely

Loopback-only, with no network exposure:

```bash
export ARK_API_KEY="..."
export ANTHROPIC_API_KEY="..." # optional in reviewed-brief mode
export COMFYUI_URL="http://127.0.0.1:8188"
npx -y @ektro-mv/mcp@0.2.0 # stdio; use the HTTP bin below for web hosts
npx -y --package @ektro-mv/mcp@0.2.0 ektro-mv-mcp-http
```

The endpoint is `http://127.0.0.1:3210/mcp`; health is `http://127.0.0.1:3210/healthz`.

For a Docker host reaching the macOS/Windows host, bind explicitly and require both authentication and DNS-rebinding protection:

```bash
export EKTRO_MV_MCP_HOST=0.0.0.0
export EKTRO_MV_MCP_PORT=3210
export EKTRO_MV_MCP_TOKEN="replace-with-a-long-random-token"
export EKTRO_MV_MCP_ALLOWED_HOSTS="host.docker.internal,localhost"
npx -y --package @ektro-mv/mcp@0.2.0 ektro-mv-mcp-http
```

Configure the client URL as `http://host.docker.internal:3210/mcp` and the header as `Authorization: Bearer <token>`. On Linux, add a deliberate host-gateway mapping or use a private service hostname and allowlist that hostname.

Do not expose this local bearer-token endpoint directly to the public internet. For public hosting, terminate TLS and implement the MCP authorization specification at a trusted gateway, set a strict Host allowlist, isolate output storage, and apply request/rate limits.

## Host-specific setup

- **Open WebUI:** Admin Settings → External Tools → add an MCP Streamable HTTP server. Use the `/mcp` URL and Bearer header. Open WebUI's native integration accepts Streamable HTTP; its `mcpo` bridge is only needed for stdio-only servers.
- **n8n:** attach an MCP Client Tool to an AI Agent, choose Streamable HTTP, configure the URL and Bearer header, and put `ektro_mv_create` behind human review. Use a tool-call timeout long enough for generation.
- **Dify:** add the HTTP MCP server to the applicable agent/tool flow. Keep credentials in Dify's secret store and require an explicit user confirmation step before creation. A separate Marketplace plugin is intentionally deferred until MCP discovery proves insufficient.
- **Langflow:** use an MCP Tools component with Streamable HTTP and the Bearer header. Build a flow that calls doctor, branches on `ok`, and pauses for approval before create.
- **Flowise:** use the MCP Client node with the same endpoint and header. Keep the create node outside automatically looping agent paths.
- **LibreChat:** merge [`librechat/librechat.example.yaml`](librechat/librechat.example.yaml), mount it into the API container, and restart LibreChat.

For all hosts, first verify `ektro_mv_doctor`. Never set `confirmedExternalCalls: true` as an invisible platform default; the value represents a specific user's approval for the run.

[Learn why Ektro open-sourced this capability](https://ektroai.com/?utm_source=http_hosts&utm_medium=integration&utm_campaign=ektro_mv&utm_content=setup_guide).
