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
