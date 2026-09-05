# Anatomy CLI docs：TanStack Start + Payload CMS 4 设计

## 目标

保留 `docs` 目录和现有文档内容，将站点从 VitePress 迁移为独立的 TanStack Start React 应用。公开页面负责安装、快速开始、CI、CLI 参考和 Anatomy 定义；Payload CMS 4 提供后台管理、内容模型和公开内容接口，静态种子内容作为本地无数据库时的安全回退。

## 架构

- `docs/src/routes` 使用 TanStack Router 文件路由：首页、文档详情、404，以及 Payload `/admin` 和 `/api` 挂载点。
- `docs/src/payload.config.ts` 使用 Payload 4 的 TanStack Start 适配器与 Postgres adapter；`/admin` 与 `/api` 路由已挂载。公开站点默认渲染内置文档数据，数据库接通后可将内容模型作为后续数据源。
- `docs/src/components/ui` 采用 Daedalus 同源的 shadcn 风格 + `@base-ui/react` 原语，统一 Button、DropdownMenu、Card、Badge、Tabs 和 ThemeToggle。
- 页面层拆分为 PublicLayout、PublicHeader、PublicHomePage、PublicDocsPage，内容渲染只消费规范化的文档模型。

## 视觉与交互

采用更克制的编辑器式文档界面：浅/深主题、紧凑顶栏、版本菜单、搜索入口、左侧文档导航和右侧目录；首页保留 Anatomy CLI 的品牌色与代码演示，但不再依赖 VitePress 默认主题 DOM。

## 数据流与错误处理

当前公开路由使用版本化的本地文档模型，保证没有数据库时首页和文档仍可用；Payload `docs` collection、Admin 和 API 已准备好，可在接入 Postgres 后切换为 CMS 数据源。所有客户端交互使用 Base UI 控件，链接和菜单保持键盘可达。

## 验证

运行 `bun install --frozen-lockfile`、`bun run docs:build`、`bun run docs:check-types`、`bun run docs:lint`，再用浏览器验证主题切换、版本菜单、导航、首页 CTA 和文档详情路由。
