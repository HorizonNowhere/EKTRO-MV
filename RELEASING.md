# Releasing EKTRO-MV

**English** · [简体中文](#简体中文)

EKTRO-MV publishes six version-aligned public npm packages. Releases run only in the protected `npm-release` GitHub environment through [`.github/workflows/release.yml`](.github/workflows/release.yml); local real publication is rejected by the release script.

## First release bootstrap

All six package names currently return `404` from npm. npm Trusted Publishing is configured from an existing package's settings, so the first release needs a short-lived bootstrap credential:

1. Confirm the npm account or organization owns the `@ektro-mv` scope.
2. Create the protected GitHub environment `npm-release` and require a reviewer.
3. Add a granular npm token as the environment secret `NPM_TOKEN`, restricted to the `@ektro-mv` scope/package set as narrowly as npm permits and publishing only.
4. Merge the release workflow to `main`.
5. Run `release` with `version=0.2.0` and `publish=false`.
6. Review the dry-run output, then rerun with `publish=true`.
7. For each new npm package, configure a GitHub Actions Trusted Publisher:
   - owner: `HorizonNowhere`
   - repository: `EKTRO-MV`
   - workflow: `release.yml`
   - environment: `npm-release`
   - allowed action: `npm publish`
8. Remove the `NPM_TOKEN` secret and revoke the bootstrap token.

The workflow grants only `contents: read` and `id-token: write`. The latter permits a short-lived OIDC token; it does not grant repository write access. Release builds intentionally disable dependency caching, and every GitHub Action is pinned to a full commit SHA.

## Safety and recovery

The release script:

- requires an exact version shared by all six packages;
- packs real tarballs and rejects leaked `workspace:` dependencies;
- checks an existing registry version's SHA-512 integrity against the local tarball;
- safely skips an already-published package only when integrity matches;
- refuses real publishing outside GitHub Actions with OIDC available;
- keeps dry-run publication local and disables provenance only for that dry-run.

After npm publication, verify clean public installation before publishing the MCP Registry record, Hermes catalog entry, or OpenClaw plugin.

## 简体中文

EKTRO-MV 会发布六个版本完全一致的公开 npm 包。真实发布只能在受保护的 GitHub `npm-release` Environment 中，通过 [`.github/workflows/release.yml`](.github/workflows/release.yml) 执行；发布脚本会拒绝本机直接发布。

由于六个包目前都还不存在，第一次发布需要一个短期 bootstrap 凭证：

1. 确认 npm 用户或组织拥有 `@ektro-mv` scope。
2. 在 GitHub 创建受保护的 `npm-release` Environment，并要求人工审批。
3. 创建 granular npm token，把权限尽可能缩小到 `@ektro-mv` scope/相关包和 publish 操作，并保存为 Environment Secret `NPM_TOKEN`。
4. 将 release workflow 合并到 `main`。
5. 先运行 `version=0.2.0`、`publish=false` 的 dry-run。
6. 审查全部 tarball 输出后，再运行 `publish=true`。
7. 六个包创建后，分别在 npm Package Settings 中配置 Trusted Publisher：
   - owner：`HorizonNowhere`
   - repository：`EKTRO-MV`
   - workflow：`release.yml`
   - environment：`npm-release`
   - allowed action：`npm publish`
8. 删除 GitHub 中的 `NPM_TOKEN` Secret，并撤销 bootstrap token。

发布脚本会检查六包版本、真实 tarball、`workspace:` 泄漏和 SHA-512 integrity。半途中断后，只有 registry 上的包与本地 tarball integrity 完全一致时才会安全跳过；发现同版本不同内容会立即阻断。工作流使用的 GitHub Actions 均固定到完整 commit SHA，避免可变标签带来的供应链漂移。

完成 npm 发布后，必须先做公网干净安装验收，再发布 MCP Registry、Hermes Catalog 或 OpenClaw ClawHub 插件。
