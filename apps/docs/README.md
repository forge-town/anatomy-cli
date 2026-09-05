# Anatomy CLI Docs

文档站点位于 `apps/docs`，技术栈为 TanStack Start、Payload CMS 4、Tailwind CSS 4，以及基于 Base UI 的 shadcn 风格组件。

```bash
bun install
bun run docs:dev
```

开发站点默认运行在 <http://127.0.0.1:5173/>。公开文档使用版本化本地内容，不依赖数据库；需要使用 Payload 管理后台时，复制 `.env.example` 为 `.env`，启动 Postgres 后运行：

```bash
bun --cwd apps/docs payload:migrate
```

后台地址为 `/admin`，API 地址为 `/api`。

## Cloudflare 自动部署

`anatomy.tools` 使用 Cloudflare Workers Static Assets。`cloudflare` 构建模式在 Node.js 中预渲染首页和 `src/content.ts` 中的全部文档，上传目录只有 `.output/public`。语言、主题切换和页面动画仍在浏览器运行。Payload 后台与 API 不在这次官网部署范围内；当前 Postgres 适配器的服务端构建无法直接在 Workers 中运行。

```bash
bun run docs:build:cloudflare
bun run docs:deploy:cloudflare --dry-run
bun run docs:preview:cloudflare
```

预览使用 Wrangler 本地运行时。发布命令先检查全部预渲染 HTML，避免误上传普通 Node 服务端构建的静态资源目录。未知路径返回 404；`/docs` 重定向至 `/docs/installation`。

首次启用：

1. 将 `anatomy.tools` 添加到目标 Cloudflare 账户，完成 DNS 接入，确认域名状态为 Active。`wrangler.jsonc` 会将此域名绑定至 `anatomy-tools` Worker。
2. 在 GitHub 仓库的 Actions secrets（或 `production` environment secrets）中配置 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`。按 Cloudflare 官方 GitHub Actions 指南创建部署 token，并将账户和域名权限限定在本项目；不要把 token 写入仓库。
3. 先发布包含一键安装器的新 `anatomy-cli` 版本。现有 npm `0.0.2` 的两个命令仍指向同一个入口，不支持官网的一键安装说明；自动部署会检查已发布的 `anatomy` 命令入口，未更新时停止发布。参见根目录 README 的 Publishing 说明。
4. 合并部署配置到 `main`。`.github/workflows/deploy-docs.yml` 会在相关页面、共享包或构建配置更新后执行检查、构建、部署。PR 只验证构建，不读取部署凭据、不发布。也可在 Actions 中选择 `main` 手动运行 **Deploy anatomy.tools**，例如 CLI 发布后重试。

构建成功的静态文件作为 GitHub artifact 保留 7 天，生产部署使用同一次运行生成的文件，发布后检查首页和安装页的 HTTP 状态。没有配置 Cloudflare 凭据或域名尚未接入时，仓库配置本身不会使网站上线。

本地手动部署前，在 `apps/docs` 目录执行 `bunx wrangler login` 登录，再回到仓库根目录执行构建和 `bun run docs:deploy:cloudflare`。回退可在 Cloudflare 的 `anatomy-tools` Worker 部署历史中选择之前的部署，或回退代码后重新运行工作流。

参考：[TanStack 静态预渲染](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)、[Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[GitHub Actions 部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)、[自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。
