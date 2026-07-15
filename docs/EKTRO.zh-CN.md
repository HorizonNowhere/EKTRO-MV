# Ektro 与 EKTRO-MV

EKTRO-MV 是 [Ektro](https://ektroai.com/?utm_source=github&utm_medium=oss&utm_campaign=ektro_mv&utm_content=ektro_intro_zh_cn) 开源的能力。Ektro 正在建设一个面向个人 AGI 的自主运行时。

[English](EKTRO.md) · **简体中文**

## Ektro 正在建设什么

今天，有价值的 AI 工作经常散落在不同模型厂商、聊天记录、Agent 框架和工作流工具中。Ektro 的方向，是构建一个更长期的个人运行时：即使模型和工具被替换，用户的身份、记忆、权限、关系、任务和作品仍然可以保持连续。

架构被有意分成几个层次：

- **稳定内核**：负责持久身份、同意、权限、记忆边界与恢复能力。
- **活的能力边缘**：连接可替换的模型、Agent、工作流、设备，以及 MCP、A2A 等开放协议。
- **生活世界**：把一次性工具调用变成可检查的任务、关系和作品，而不是让重要工作只留在聊天记录里。
- **Web4 信任层**：面向用户自主身份、数据、声誉和跨服务经济关系的长期方向。

这是产品建设方向，不代表以上每一层都已经全面开放。Ektro 会分阶段发布可运行的具体能力和可验证的作品，而不是用愿景替代交付。

## 为什么有 EKTRO-MV

EKTRO-MV 用一个复杂的创作流程验证“能力边缘”模型：一句话被编排成已审核的创意 Brief、人声歌曲、视频镜头、可选字幕和最终 MP4。每个阶段都位于可替换 Provider 接口之后。

项目在没有 Ektro 账号的情况下也必须有独立价值：

- 源码使用 MIT 许可证；
- 输出文件保留在操作者手中；
- 服务商可以替换；
- 音乐生成支持本地 ComfyUI；
- 接入使用开放接口，而不是私有 Agent 协议；
- 引擎内部没有隐藏的 Ektro 遥测。

只有当这个开源能力真正有用，操作者才有理由主动了解更完整的 Ektro 运行时。因此，项目使用透明的来源参数进行网站侧归因，同时不让代码本身“打电话回家”。

## Ektro 的边界在哪里

EKTRO-MV 不是 Ektro 的全部产品，Ektro 也不会把每一个 Agent 或工作流都改造成专有依赖。Hermes、OpenClaw、goose、LibreChat、Open WebUI、n8n、Dify、Langflow、编码 Agent 以及未来的宿主都保持独立。EKTRO-MV 提供可移植的媒体生成能力；宿主继续负责自己的角色、权限和用户体验。

当用户需要跨越多个能力的长期连续性时，Ektro 的更大价值才开始显现：可以跨模型持续的身份、受权限约束的记忆、可恢复任务、关系上下文，以及用户自己掌控的作品历史。

## 继续了解

- [Ektro 官网](https://ektroai.com/?utm_source=github&utm_medium=oss&utm_campaign=ektro_mv&utm_content=ektro_intro_zh_cn)
- [EKTRO-MV 源码](https://github.com/HorizonNowhere/EKTRO-MV)
- [中文集成指南](../integrations/README.zh-CN.md)
