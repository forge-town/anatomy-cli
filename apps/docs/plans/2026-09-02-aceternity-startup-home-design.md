# Anatomy Docs Aceternity Startup 首页重构

## 目标

将首页改为 Aceternity Startup Landing Page 模板的结构与排版：白底斜线背景、胶囊导航、居中 Hero、dashboard 预览、非对称功能卡片网格、三列定价卡、信任 CTA 与多列 footer。Anatomy 的安装、定义、检查和 CI 文案替换模板中的创业服务文案，但不改变现有文档路由。

## 组件方案

- `StartupHeader`：圆角悬浮导航，桌面显示 Features / Pricing / Contact / theme / 文档入口 / 开始使用，移动端折叠为菜单。
- `StartupHero`：居中大标题、双 CTA 和 dashboard 预览图，使用斜线背景装饰。
- `StartupFeatureGrid`：复刻模板的 2/3 + 1/3、1/3 + 2/3 卡片排版，使用 shadcn `Card` 与 Base UI `Button`。
- `StartupPricing`：三列 Hobby / Starter / Pro 结构，Starter 保留 Featured 徽标。
- `StartupCta` 与 `StartupFooter`：复刻底部 CTA、头像叠放、信任指标和四列 footer。

## 内容与交互

首页继续使用 i18next，中文为默认语言，英文由现有语言切换器切换。CTA 连接安装文档、定义示例和 CI 文档；安装命令交互保留在文档页而不是复制模板中的无关表单。主题按钮和移动菜单使用现有 Base UI 封装。

## 验证

从 `apps/docs` 路径运行类型检查、Lint 和生产构建，并在浏览器对照模板检查 1280px 桌面首屏、功能网格、定价区、底部 CTA 以及 390px 移动端的导航和无横向溢出。
