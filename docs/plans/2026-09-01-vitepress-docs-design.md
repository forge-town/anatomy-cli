# Anatomy CLI VitePress 文档站设计

## 目标

为 Anatomy CLI 提供一个中文优先、可以直接复制命令的文档站，覆盖发布版安装、仓库内快速开始、CLI 参数、Anatomy 定义概念和本地开发。首屏需要在几秒内回答“它是什么、怎么安装、下一步跑什么命令”。

## 视觉方向

参考 Vite 官网的营销型首页布局：深色主背景、顶部产品导航、左对齐大标题与双 CTA、右侧包管理器代码演示、品牌信任条、2×2 能力网格、社区引用和 CTA/Footer。保留 Anatomy CLI 自己的内容与标识，使用 Vite 的午夜黑、薰衣草紫、aqua 与 zest 作为统一强调色，不直接复制 Vite 的品牌资产。

## 信息架构

- 首页：产品定位、安装入口、30 秒 Quick Start、检查流程和能力概览。
- 开始使用：安装、第一次检查、CI 集成。
- CLI 参考：参数、退出码、输出格式和忽略路径。
- Anatomy 定义：Draft 结构、示例定义与检查规则。
- 项目开发：仓库布局、常用脚本与发布流程。

## 技术方案

在根目录增加 `docs` VitePress app，使用 `.vitepress/config.ts` 配置导航、侧栏、搜索和深色主题；Tailwind CSS 负责主题 token 与工具类，shadcn-vue 风格的 Button、Card、Badge、Separator 作为首页交互与内容原语。根 `package.json` 提供 `docs:dev`、`docs:build`、`docs:preview` 脚本；依赖锁定在 workspace 根目录。

## 验证

运行 `bun install --frozen-lockfile` 后执行 `bun run docs:build`，确保 VitePress 能生成静态站点；同时运行 `bun run check-types`，确认配置文件的 TypeScript 类型正确。
