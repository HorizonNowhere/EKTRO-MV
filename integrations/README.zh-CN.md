# EKTRO-MV 接入指南

[English](README.md) · **简体中文**

EKTRO-MV 在不同宿主中暴露相同的两个工具：

- `ektro_mv_doctor`：只读环境检查。
- `ektro_mv_create`：写入本地产物并可能调用付费模型 API；只有用户明确批准当前运行后，才能传入 `confirmedExternalCalls: true`。

如果宿主和 EKTRO-MV 位于同一台机器，并且宿主可以启动 `npx`，优先使用 stdio。如果宿主位于 Docker、另一台机器，或者只接受网络 MCP 服务，则使用 Streamable HTTP。

| 宿主 | 接入资产 | 推荐方式 | 上游规则 |
|---|---|---|---|
| Hermes Agent | [`hermes/optional-mcps/ektro-mv/manifest.yaml`](hermes/optional-mcps/ektro-mv/manifest.yaml) | stdio | 只提交 `optional-mcps` 目录，不修改 Hermes core |
| OpenClaw | [`openclaw/`](openclaw/) | 原生 Tool Plugin | 发布到 ClawHub，不向 core 仓库提交普通社区插件 |
| goose | [`goose/ektro-mv.yaml`](goose/ektro-mv.yaml) | stdio Recipe | 未来目录 PR 保持精简、教程化、少营销文案 |
| LibreChat | [`librechat/librechat.example.yaml`](librechat/librechat.example.yaml) | Docker 推荐 HTTP | 配置私网 allowlist、用户凭证和长任务 timeout |
| Open WebUI、n8n、Dify、Langflow、Flowise | [`http-hosts.md`](http-hosts.md) | Streamable HTTP | 使用各自 MCP 节点/External Tool，不复制核心插件 |
| Gemini CLI、Qwen Code、OpenCode、Continue、Cline | [`mcp-clients.md`](mcp-clients.md) | stdio | Registry + 版本锁定配置；保留工具确认流程 |

## 部署与服务商注意事项

- 默认视频 Provider 使用火山引擎 Ark；正式使用前请确认当前账号、部署地区、价格与内容条款，必要时实现其他 `VideoProvider`。
- 音乐默认通过本地 ComfyUI + ACE-Step 生成；宿主在 Docker 中时，需要正确配置宿主机网络地址。
- 使用经过审核的结构化 brief 可以跳过 Anthropic 创意大脑，也可以实现其他 `BrainProvider`。
- stdio 适合本机 Agent；容器化和 Web 宿主优先使用带 Token 与 Host allowlist 的 HTTP 服务。
- 不要在无人值守的 Agent 循环中默认允许 `ektro_mv_create`，也不要在 YAML、Issue、PR 或聊天记录中粘贴真实 API Key。

## 上游发布顺序

```text
npm 0.2.0 六个包
→ 干净安装复验
→ 真实 MV 成片证据
→ MCP Registry
→ Hermes optional-mcps PR
→ OpenClaw ClawHub
→ goose / OpenCode
→ n8n / Open WebUI 等模板
```

详细目标选择见[生态调研报告](../docs/ecosystem-integration-strategy.md)，PR 范围、来源参数与发布门禁见[上游提交手册](upstream-submissions.md)，Ektro 的完整中文介绍见 [`docs/EKTRO.zh-CN.md`](../docs/EKTRO.zh-CN.md)。
