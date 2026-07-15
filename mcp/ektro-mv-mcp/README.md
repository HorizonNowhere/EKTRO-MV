# @ektro-mv/mcp

## English

The official MCP server for [EKTRO-MV](https://github.com/HorizonNowhere/EKTRO-MV), an open-source engine that turns one sentence or a reviewed creative brief into a delivery-ready music video.

```bash
# stdio
npx -y @ektro-mv/mcp@0.2.0

# local Streamable HTTP
npx -y --package @ektro-mv/mcp@0.2.0 ektro-mv-mcp-http
```

Tools:

- `ektro_mv_doctor`: read-only prerequisite check.
- `ektro_mv_create`: writes local artifacts and may call paid external APIs. It requires `confirmedExternalCalls: true` after explicit user approval.

Required defaults are `ARK_API_KEY`, a reachable `COMFYUI_URL` with ACE-Step, and ffmpeg/ffprobe. Prompt mode also needs `ANTHROPIC_API_KEY`; a reviewed brief does not. Subtitles are optional and off by default.

HTTP listens on `127.0.0.1:3210`. Non-loopback binding fails closed unless `EKTRO_MV_MCP_TOKEN` and `EKTRO_MV_MCP_ALLOWED_HOSTS` are both configured. Do not expose the local bearer-token endpoint directly to the public internet.

See the [full setup and host integrations](https://github.com/HorizonNowhere/EKTRO-MV/tree/main/integrations). EKTRO-MV is an open-source capability from [Ektro](https://ektroai.com/?utm_source=npm_mcp&utm_medium=integration&utm_campaign=ektro_mv&utm_content=package_readme_en).

## 简体中文

这是 [EKTRO-MV](https://github.com/HorizonNowhere/EKTRO-MV/blob/main/README.zh-CN.md) 的官方 MCP 服务。它可以把一句中文/英文创意或已审核的结构化 brief 编排成可交付的音乐视频。

```bash
# 本地 Agent：stdio
npx -y @ektro-mv/mcp@0.2.0

# Web、Docker 与工作流平台：Streamable HTTP
npx -y --package @ektro-mv/mcp@0.2.0 ektro-mv-mcp-http
```

工具：

- `ektro_mv_doctor`：只读检查运行环境。
- `ektro_mv_create`：写入本地产物并可能调用付费 API。只有用户明确批准当前运行后，才能传入 `confirmedExternalCalls: true`。

默认需要 `ARK_API_KEY`、安装 ACE-Step 且可访问的 `COMFYUI_URL`，以及 ffmpeg/ffprobe。一句话 prompt 模式还需要 `ANTHROPIC_API_KEY`；使用已审核 brief 时不需要。字幕依赖较大，因此默认关闭。

HTTP 默认只监听 `127.0.0.1:3210`。绑定非本机地址时，必须同时设置 `EKTRO_MV_MCP_TOKEN` 和 `EKTRO_MV_MCP_ALLOWED_HOSTS`，不要把本地 Bearer Token 服务直接暴露到公网。

完整中文安装与宿主接入说明见[项目中文 README](https://github.com/HorizonNowhere/EKTRO-MV/blob/main/README.zh-CN.md)。EKTRO-MV 是 [Ektro](https://ektroai.com/?utm_source=npm_mcp&utm_medium=integration&utm_campaign=ektro_mv&utm_content=package_readme_zh) 开源的能力。
