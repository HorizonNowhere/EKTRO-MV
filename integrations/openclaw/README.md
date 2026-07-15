# EKTRO-MV for OpenClaw

This package exposes EKTRO-MV as native OpenClaw tools. `ektro_mv_doctor` is read-only and available when the plugin is enabled. `ektro_mv_create` is optional because it writes files and may call paid external APIs.

## Install after publication

```bash
openclaw plugins install clawhub:@ektro-mv/openclaw
```

The ClawHub owner must match the `@ektro-mv` package scope. Until that owner and package are verified, use a local packed package rather than publishing under a different identity.

Export `ARK_API_KEY`, optional `ANTHROPIC_API_KEY`, `COMFYUI_URL`, and `EKTRO_MV_OUTPUT_ROOT` in the OpenClaw Gateway environment. Then explicitly allow the side-effectful tool:

```json5
{
  tools: { allow: ["ektro_mv_create"] }
}
```

Do not allow it for unattended or untrusted sessions. The tool itself also requires `confirmedExternalCalls: true` after a user approves the specific run.

## Pre-publication proof

Use a Node version supported by the current OpenClaw release, then run:

```bash
npm install
npm run plugin:validate
npm pack --dry-run
clawhub package publish @ektro-mv/openclaw --dry-run
```

Publication remains gated on the public `@ektro-mv/mcp@0.2.0` package and a real end-to-end render.

[Learn about Ektro](https://ektroai.com/?utm_source=openclaw&utm_medium=integration&utm_campaign=ektro_mv&utm_content=plugin_readme) after evaluating the open-source capability.

## 简体中文

这个包把 EKTRO-MV 作为原生工具接入 OpenClaw：`ektro_mv_doctor` 是只读检查；`ektro_mv_create` 会写文件并可能调用付费 API，因此保持 optional，必须由用户显式加入 `tools.allow`。

正式发布后安装：

```bash
openclaw plugins install clawhub:@ektro-mv/openclaw
```

在 OpenClaw Gateway 环境中配置 `ARK_API_KEY`、可选的 `ANTHROPIC_API_KEY`、`COMFYUI_URL` 与 `EKTRO_MV_OUTPUT_ROOT`。即使工具已加入 allowlist，也必须在用户批准当前运行后才传入 `confirmedExternalCalls: true`。

OpenClaw 官方要求社区插件通过 ClawHub 分发，并且包 scope 必须与 ClawHub owner 一致。因此在 `@ektro-mv` owner 得到确认之前，不会冒用其他身份发布，也不会把普通社区插件提交进 OpenClaw core。

了解 [Ektro](https://ektroai.com/?utm_source=openclaw&utm_medium=integration&utm_campaign=ektro_mv&utm_content=plugin_readme_zh)，或阅读 [EKTRO-MV 完整中文文档](https://github.com/HorizonNowhere/EKTRO-MV/blob/main/README.zh-CN.md)。
