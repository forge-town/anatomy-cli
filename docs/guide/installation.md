# 安装

Anatomy CLI 发布包提供 `anatomy-cli` 和 `anatomy` 两个命令别名。选择与你的环境匹配的方式即可。

## 发布版安装

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.sh | sh
```

### Windows PowerShell

```powershell
powershell -c "irm https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.ps1 | iex"
```

### 包管理器

::: code-group

```bash [npm]
npm install -g --ignore-scripts anatomy-cli
```

```bash [pnpm]
pnpm add -g --ignore-scripts anatomy-cli
```

```bash [Bun]
bun add -g --ignore-scripts anatomy-cli
```

:::

安装后确认命令可用：

```bash
anatomy-cli --help
```

::: warning 运行时要求
开发仓库需要 Bun 1.3+。从 npm、pnpm 或 Bun 安装的发布包是独立的 Node.js 入口，需要 Node.js 18+。
:::

## 从源码运行

```bash
git clone https://github.com/forge-town/anatomy-cli.git
cd anatomy-cli
bun install --frozen-lockfile
bun run anatomy --help
```

下一步：跟着 [第一次检查](/guide/quick-start) 跑通一个真实目录。
