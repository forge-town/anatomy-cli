# 首页线条主义视觉重构设计

## 目标

将 docs 首页从卡片堆叠的营销页收敛为面向开发者的线性工具页。视觉参考 OpenClaw 的 Quick Start 与 Vite 的 hero/包管理器切换结构：统一内容网格、低对比度 1px 分隔线、克制的暖灰色表面、mono 标签，以及单一橙红强调色。现有中文默认、英文切换、安装命令复制、扫描滚动动画和 hero 标题字号保持不变。

## 页面结构

1. `StartupHeader`：sticky 顶栏，底部细线，统一最大宽度；桌面显示主导航、主题、语言和文档入口，移动端使用菜单。
2. `StartupHero`：中心对齐的中文 hero，保留现有 `52px` 大标题。标题、说明和 Quick Start 连续排列，不再放置大型装饰卡片。
3. Quick Start：安装标签、包管理器 tabs、命令行和复制按钮组成一个扁平工具块。白天使用暖灰 token，深色主题使用独立暗色 token；active tab 和 shell 提示符使用橙红色。
4. `StructureScanPreview`：全宽编辑器式双栏。左侧显示 anatomy 定义，右侧显示真实目录树；目录行按滚动进度逐条出现，状态使用图标和行色表达。
5. `StartupFeatures`、`StartupCta`、`StartupFooter`：去除 dashboard/mock 卡片和强阴影，使用线性内容、细分隔线和少量交互控件收尾。

## 组件与数据流

- 交互继续使用现有 shadcn/Base UI `Button`、`Select`（语言切换）组件；页面展示采用语义化 HTML。
- `installCommands` 作为包管理器到命令的单向映射；切换 tab 只更新命令文本，复制动作通过 Clipboard API 并保留兼容 fallback。
- 扫描演示使用 `Intersection` 几何计算和单调的 `scanStage` 状态；滚动向上时不回退，避免内容闪烁。
- 颜色写入 `styles.css` 的语义 CSS variables，组件只引用 token，不新增散落的页面级样式规则。
- 文案全部从 i18next 的 `zh.json` / `en.json` 读取，中文作为 SSR 默认语言。

## 验收与风险

- 保持 H1 `lg:text-[52px]`，不改变首屏标题视觉重量。
- 在 1154px 桌面宽度和窄屏检查：无横向溢出、无意外黑色边框、Quick Start 层级清楚、导航不挤压。
- 验证 npm/pnpm/bun 切换与复制按钮；验证扫描行在进入视口中心后依次出现且向上滚动不撤回。
- 运行 `bun run check-types`、`bun run build`、本地 SSR HTTP smoke check，并执行 `git diff --check`。
- 参考页面只提供布局和视觉语言，不复制 OpenClaw/Vite 的品牌文案或资源。
