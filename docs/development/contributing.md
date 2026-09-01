# 仓库布局与开发

Anatomy CLI 是一个 Bun monorepo：

| 路径 | 职责 |
| --- | --- |
| `apps/anatomy-cli` | CLI 入口、参数解析与文件系统适配 |
| `packages/anatomy` | 不可变 Anatomy 树工具与 conformance engine |
| `packages/schemas` | Anatomy Draft 的运行时 schema |
| `packages/anatomy-cli-config` | 可复用的示例定义 |

## 常用脚本

```bash
bun install --frozen-lockfile
bun run quality       # 类型、lint、测试、构建
bun run docs:dev      # 启动文档站开发服务器
bun run docs:build    # 构建静态文档站
```

CLI 包也提供 `scan:self` 和 `scan:schemas`，用于检查仓库内置示例。

## 发布 CLI

根包保持 private；发布 CLI 时进入 app workspace：

```bash
cd apps/anatomy-cli
bun publish --access public
```

发布前建议运行 `bun run quality`，确认 Node.js bundle 与文档中的安装方式保持一致。
