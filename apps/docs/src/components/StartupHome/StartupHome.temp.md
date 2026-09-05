# StartupHome 组件拆分结构

## 文件结构

```text
apps/docs/src/components/StartupHome/
├── index.ts  # component: 导出 StartupHome 及其子组件
├── StartupHome.tsx  # component: 页面根组件与区块组合
├── StartupHeader.tsx  # component: 顶部导航和菜单状态
├── StartupHero.tsx  # component: 首屏和安装命令交互
├── StartupGridBackground.tsx  # component: 首屏背景图案层
├── StructureScanPreview.tsx  # component: 目录扫描预览
├── StartupScanSection.tsx  # component: 扫描结果统计区域
├── StartupTerminalCase.tsx  # component: 真实终端使用案例
├── StartupCta.tsx  # component: 行动号召区域
├── StartupFooter.tsx  # component: 页脚内容
├── RhombusPattern.tsx  # component: Penrose P3 菱形密铺 SVG 图层
└── KiteDartPattern.tsx  # component: Penrose P2 kite-dart 非周期密铺 SVG 图层
```

## 拆分理由

StartupHome 原文件同时承担页面编排、导航状态、首屏动画、终端案例、扫描预览、CTA 和页脚渲染。按视觉区块拆成独立组件后，根组件只负责组合，各区块保留自己的状态和副作用，不通过父组件层层传递业务数据。扫描数据继续放在扫描预览组件附近，避免为了拆分制造额外抽象；现有 RhombusPattern 作为独立背景组件保留。
