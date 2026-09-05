# anatomy.tools 自动部署设计

## 目标和范围

从已合并的 main（acefcc4）建立 codex/deploy-anatomy-tools 分支，实现 Cloudflare 官网发布。用户指定 Cloudflare；自动发布目标是 main 上的官网更新。

## 方案选择

评估了 Nitro Workers 服务端、静态预渲染、替换 Cloudflare Vite 插件三种方式。现有 Nitro Workers 构建和 dry-run 成功，但实际访问首页、文档返回 500，原因是 Payload Postgres 适配器在 Workers 中调用 fileURLToPath(undefined)。采用静态预渲染发布公开页面，保留现有本地 Node/Payload 开发方式，CMS 后台和 API 不属于官网发布产物。

## 实现

Vite cloudflare 模式通过 TanStack Start 预渲染首页与 docsEntries 中的全部文档，显式禁止后台路由自动发现和链接爬取，任何页面生成失败即终止。Nitro 使用 node-server 在构建机渲染；Wrangler 只上传 .output/public。发布前检查全部页面的 HTML 与脚本标签，以及文档重定向。

Cloudflare Worker 名称 anatomy-tools，Custom Domain 为 anatomy.tools。未知路径返回 404；/docs 重定向到安装页。浏览器继续执行原有语言、主题、导航和动画代码。

GitHub Actions 在 PR 上检查类型、lint、19 个文档测试、静态构建和 Wrangler dry-run。main 更新或在 main 手动运行时，生产任务下载同一运行的构建产物，检查 npm 安装器入口，使用 production 环境的 Cloudflare secrets 部署，再验证线上首页和安装页 HTTP 状态。部署失败不报告成功，回退通过 Cloudflare 部署历史或代码回退后重发完成。

## 验证与上线依赖

本地已生成 9 个公开页面；Cloudflare 本地运行时全部返回 200；后台、API、未知路径返回 404；/docs 返回 302。浏览器验证了主题切换和客户端文档导航。Wrangler 静态上传预检、完整 bun run quality（90 个测试、类型检查、lint、CLI 构建）和 actionlint 均通过。本地开发服务器重启后首页返回 200。

生产未部署。Wrangler 当前未认证；GitHub 没有 Cloudflare secrets；公开 DNS 查询仍显示 GoDaddy nameservers。需要将域名接入 Cloudflare、配置 CLOUDFLARE_ACCOUNT_ID 与 CLOUDFLARE_API_TOKEN，并先发布含新版安装器的 anatomy-cli（npm latest 当前为旧版 0.0.2）。当前部署 gate 会阻止先发布不匹配的安装说明。

验证日志、HTML 保留在 docs/verification/cloudflare（忽略于 Git）。Task Tracer MCP 当前不可用，无法注册运行时任务；未使用数据库绕过。
