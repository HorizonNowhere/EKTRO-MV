# MCP client configuration

Export credentials in the environment that starts the client. Do not paste real keys into committed JSON.

## Gemini CLI

```bash
gemini mcp add ektro-mv npx -y @ektro-mv/mcp@0.2.0 --scope user
gemini mcp list
```

Or add this to `~/.gemini/settings.json` or `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "ektro-mv": {
      "command": "npx",
      "args": ["-y", "@ektro-mv/mcp@0.2.0"]
    }
  }
}
```

Use `/mcp list` to verify or `/mcp reload` after changing the configuration.

## Qwen Code

```bash
qwen mcp add --scope user ektro-mv npx -y @ektro-mv/mcp@0.2.0
```

Equivalent `~/.qwen/settings.json` or `.qwen/settings.json`:

```json
{
  "mcpServers": {
    "ektro-mv": {
      "command": "npx",
      "args": ["-y", "@ektro-mv/mcp@0.2.0"],
      "discoveryTimeoutMs": 30000,
      "timeout": 1800000
    }
  }
}
```

Do not set `trust: true`: Qwen's tool confirmation is useful because creation has side effects and potential cost.

## OpenCode

Add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "ektro-mv": {
      "type": "local",
      "command": ["npx", "-y", "@ektro-mv/mcp@0.2.0"],
      "enabled": true
    }
  }
}
```

To expose the tools only to a dedicated creative agent, disable the `ektro-mv*` tool glob globally and enable it in that agent's tool map.

## Other stdio MCP clients

Use this standard server entry in clients such as Continue and Cline:

```json
{
  "mcpServers": {
    "ektro-mv": {
      "command": "npx",
      "args": ["-y", "@ektro-mv/mcp@0.2.0"]
    }
  }
}
```

Run `ektro_mv_doctor` first. Before calling `ektro_mv_create`, present the planned prompt/brief, output location, provider calls, and possible cost; set `confirmedExternalCalls: true` only after explicit approval.

[Explore Ektro](https://ektroai.com/?utm_source=mcp_clients&utm_medium=integration&utm_campaign=ektro_mv&utm_content=config_guide) after the open-source capability is useful to you.
