# MonoLaunch 首页重构设计

## 目标

彻底替换当前首页的 Galaxy/SaaS 视觉，改用 `/Users/amin/projects/code-forge/apps/lab` 中 `MonoLaunchHome` 的完整视觉语法：纸张底色、硬边框、像素方块、编辑型排版和可展开的索引入口。首页需要让用户第一眼理解 Anatomy 是一个“描述并检查仓库结构”的工具，而不是看到一个泛化的装饰性 hero。

## 视觉方向

- 画布：`#f2efe8` 暖纸张底，`#26352e` 深墨绿文字与边框。
- 强调色：`#d9654b` 珊瑚色用于状态、导线和交互反馈；`#d5ef91` 酸橙色用于 hover 展开态。
- 布局：顶部 64px 索引栏；主体为左 58% / 右 42% 双栏；左侧底部为结构入口 rail；右侧为实时像素结构画布与命令控制台。
- 排版：巨大 `ANATOMY.` 字标和中文主标题，结合等宽元信息、版本号、规则数量与边缘标尺；不使用紫色渐变、霓虹光球或无语义卡片。

## 组件架构

### `MonoLaunchHero`

负责全屏布局、进入动画、标题区、版本/规则统计和响应式断点。桌面使用双栏网格，小屏改为纵向：标题先出现，像素画布随后出现，入口 rail 变为横向滚动区域。

### `MonoBlockCanvas`

从 Lab 的 `MonoBlockCanvas` 移植并改造成 Anatomy 专用场景。保持 36×26 网格、动态信号、字形块和 pointer feedback；字形改为 `A / N / A` 或 Anatomy 结构符号。Canvas 只负责视觉数据，不直接绘制任何可翻译文案。

### `StructureIndexRail`

三张入口卡对应“定义形状”“确定性检查”“接入 CI”。默认只展示编号与标题； hover/focus 后向上展开 3×3 像素标记、说明和文档链接。交互使用 Base UI Button/Link 语义，键盘 focus 与 pointer hover 保持同一反馈。

### `CommandConsole`

展示示例命令、检查数量、`conforms` 状态和入口链接。沿用 Shadcn/Base UI 的 Card、Button 基础组件，但表面样式严格使用 MonoLaunch 的硬边框、纸张色和偏移阴影。

## 数据与国际化

所有标题、说明、入口卡文案、状态信息进入 i18next `zh/en` resources。中文是显式产品默认；英文通过语言选择器切换并持久化。稳定的 route、shell command、版本号和技术名词保留为数据，不在组件中写语言条件判断。文档详情页也复用相同的 locale key，避免首页英文而详情页仍是中文。

## 动效与可访问性

- 首屏：左侧标题按元信息、主标题、说明、CTA 的顺序 reveal；右侧画布独立启动。
- Canvas：信号在网格中缓慢流动；pointer 移动产生局部珊瑚色扰动；点击触发一次方块重排脉冲。
- Rail：展开只改变高度、背景色和内容 opacity，不使用复杂弹簧动画，避免布局抖动。
- `prefers-reduced-motion: reduce` 时关闭 reveal、重排和 hover 动画，保留完整静态结构。
- Canvas 不可用时显示静态网格和明确的 fallback 文案；复制功能失败时不调用原生 alert。

## 验证标准

1. `bun run docs:check-types`、`bun run docs:lint`、`bun run docs:build` 全部通过。
2. 浏览器验证中文默认、英文切换、文档详情页双语、CTA 路由和语言持久化。
3. 1280px 桌面与 390px 移动端截图检查：无横向溢出，rail 和 canvas 不裁切主要内容。
4. 键盘 focus、Canvas fallback、reduced-motion 和没有 Clipboard API 的环境均可用。

## 非目标

- 不复制 Lab 的整套主题切换器或实验室导航。
- 不引入 Spline/WebGL 运行时作为首屏硬依赖；优先使用稳定的 Canvas 2D 结构画布。
- 不改变 Payload CMS、文档路由或 CLI 功能，只重构公共首页视觉与相关双语展示。
