# Docs UI：Tailwind utilities + shadcn/Base UI 收敛方案

## 问题

当前页面虽然使用了 Base UI 原语，但页面主体依赖大量语义化自定义 class 和一份大型 `styles.css`。这让组件 API、视觉 token 和实际布局分散在两套系统中，也容易造成主题和下拉菜单间距不一致。

## 决策

- `styles.css` 只保留字体导入、Tailwind 入口、主题 CSS variables 和浏览器基础 reset。
- 页面布局、响应式断点、颜色、间距、阴影和排版统一使用 Tailwind utility classes，直接靠近 JSX 结构。
- Button、Card、Badge、DropdownMenu 继续作为 shadcn 风格组件封装 Base UI 原语；组件内部使用 CSS variables，而不是硬编码深色调色板。
- 公开页面分别由 `PublicLayout` 包裹，Payload root shell 不再被公共页头和页脚污染。

## 视觉规范

默认深色主题使用紫色/青色品牌对比，浅色主题通过同一组 variables 切换；首页保持产品型 hero、终端示例、安装命令、工作流卡片和 CTA，文档页保持三栏导航结构。移动端在 900px 和 560px 断点折叠导航与内容列。

## 验证

`bun --cwd docs check-types`、`bun --cwd docs lint`、`bun --cwd docs build` 均需通过；开发服务器首页和 `/docs/installation` 需返回 HTTP 200，源码中不再出现旧的 `hero`、`site-header`、`docs-layout` 等页面级 CSS class。
