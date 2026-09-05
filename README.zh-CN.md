# Anatomy

[English](./README.md) | **简体中文**

[anatomy.tools](https://anatomy.tools) 是一个开源工具，用于根据版本化的 Anatomy 定义验证仓库文件树。完整指南见 [anatomy.tools/docs](https://anatomy.tools/docs)。

## 工作区结构

- `apps/anatomy-cli` — 命令行接口与文件系统适配器
- `packages/anatomy` — 不可变 Anatomy 树工具与结构检查引擎
- `packages/schemas` — 带运行时校验的 Anatomy Draft Schema；`anatomy` 领域是此独立工作区的公开接口
- `packages/anatomy-cli-config` — 可复用的 Anatomy 定义示例

迁移保留了原有模块边界：Daedalus CLI 成为应用，树操作与检查引擎归入 `packages/anatomy`，`packages/schemas` 仅保留 Anatomy Schema 及其依赖。Daedalus 内部工作区别名已替换为独立的 `@anatomy-cli/*` 作用域。

实现基于结构化文件树，不依赖临时编写的源码扫描规则：

```text
JSON Anatomy Draft
        ↓
deterministic filesystem tree
        ↓
name / nesting / quantity / one-of checks
        ↓
block · warn · allow result
```

## 环境要求

- Bun 1.3 或更新版本
- 通过 npm 或 pnpm 安装已发布 CLI 包时，需要 Node.js 18 或更新版本

仓库开发以 Bun 为主。发布的 CLI 会打包为独立的 Node.js 入口，从包仓库安装时不需要 Bun。

## 安装 Anatomy

从以下命令中选择**一条**运行一次，之后直接使用 `anatomy`：

```bash
npx anatomy-cli
pnpm dlx anatomy-cli
bunx anatomy-cli
```

一键安装器支持 macOS、Linux 和 Windows，需要 Node.js 18+。它将下载的 `anatomy-cli` 版本中已打包的独立 CLI 复制到 `~/.anatomy`，包管理器清理缓存后仍可使用。安装无需再次下载包、无需管理员权限，也不会修改项目依赖。包名保持为 `anatomy-cli`，日常使用的命令是 `anatomy`。

安装器会将其 `bin` 目录加入受支持的 Shell 配置文件或 Windows 用户 PATH。已有配置内容会保留，首次修改前会生成 `.anatomy-backup` 备份。安装后**打开新终端**，再运行：

```bash
anatomy --help
anatomy ./src
```

安装过程不会生成 `anatomy.json`，请按下文说明在仓库中维护定义。对于无法识别的 Shell 或只读配置文件，安装器会给出手动配置 PATH 的说明。

### 升级、自定义安装或卸载

```bash
# Install the latest published release
pnpm dlx anatomy-cli@latest

# Inspect installer options without changing anything
pnpm dlx anatomy-cli --help

# Let your environment manage PATH (use an absolute prefix)
pnpm dlx anatomy-cli --prefix /absolute/path/to/anatomy --no-modify-path

# Remove this installer's CLI; leaves projects, PATH settings and backups alone
pnpm dlx anatomy-cli --uninstall
```

升级或卸载自定义安装时，请使用相同的 `--prefix`。也可通过 `ANATOMY_INSTALL_DIR` 设置安装目录，或通过 `ANATOMY_NO_MODIFY_PATH=1` 禁止修改 Shell 配置。安装器会拒绝使用非空且不属于它的目录。

卸载后，可手动删除 Shell 配置或 Windows 用户 PATH 中的 Anatomy 条目。安装标记会保留，以便安全地复用这个专用目录。

如果更习惯由包管理器维护全局安装，也可以使用：

```bash
npm install -g --ignore-scripts anatomy-cli
pnpm add -g --ignore-scripts anatomy-cli
bun add -g --ignore-scripts anatomy-cli
```

这些命令使用包管理器的全局目录，应通过对应包管理器卸载，而不是使用一键安装器的 `--uninstall`。

给 `anatomy-cli` 传入目标路径，仍可执行临时检查，例如 `pnpm dlx anatomy-cli ./src`。`anatomy` 命令始终执行检查，即使没有提供目标路径。

## 快速开始

将 `anatomy.json` 放在待检查目录或其任一父目录中，然后直接传入目标路径：

```bash
anatomy ./src
```

不传入目标路径时，`anatomy` 检查当前目录。它会从目标目录向上查找，使用最近的 `anatomy.json`。仅当定义使用其他名称或位置时，才需要指定 `--definition`：

```bash
anatomy ./src --definition ./config/service.anatomy.json
```

如果要从开源仓库运行，而不是使用已发布的版本：

```bash
bun install --frozen-lockfile
bun run anatomy --help
bun run anatomy ./packages/schemas/src/anatomy \
  --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json
```

上面的示例使用仓库内的定义检查本仓库，退出码反映当前文件树是否仍符合该定义。`apps/anatomy-cli/anatomies/` 下还提供了 CLI、Service 文件和 Drizzle 数据表目录结构的具体示例。

原先仅用于 Daedalus 私有模型、服务和应用包的快捷命令未迁移到此项目，请将目标路径作为第一个参数传入。

CI 集成可使用 `--format json` 输出 JSON；可重复传入 `--ignore` 来忽略更多目录名称。退出码保持稳定：

- `0` — 目标符合定义
- `1` — 存在一个或多个严重级别为 `block` 的检查结果
- `2` — 无法读取定义或目标

Anatomy JSON 定义只需包含供人阅读的元数据和结构约束。可以省略节点 `id` 和空的 `policyOverrides` 对象，Schema 会在读取时生成 ID 并补齐默认策略。基于本项目 `apps/anatomy-cli/src` 目录编写的完整示例见 [`cli-source.anatomy.json`](./apps/anatomy-cli/anatomies/cli-source.anatomy.json)。

### 约束占位符名称

使用 `structure.bindings` 约束占位符捕获的值。每项绑定可以使用一种内置格式、自定义正则表达式，或同时使用两者：

```json
{
  "structure": {
    "schemaVersion": 1,
    "defaultPolicies": {
      "missingRequired": "block",
      "unexpectedEntry": "warn",
      "nameMismatch": "warn",
      "nestingMismatch": "block"
    },
    "bindings": {
      "Name": {
        "format": "PascalCase",
        "pattern": "[A-Z][A-Za-z0-9]*"
      }
    },
    "root": {
      "children": [
        {
          "kind": "directory",
          "name": { "type": "placeholder", "value": "<Name>Service" },
          "quantity": "exactly_one",
          "children": [
            {
              "kind": "file",
              "name": { "type": "placeholder", "value": "<Name>Service.ts" },
              "quantity": "exactly_one"
            }
          ]
        }
      ]
    }
  }
}
```

支持的内置格式包括 `PascalCase`、`camelCase`、`kebab-case`、`snake_case` 和 `SCREAMING_SNAKE_CASE`。自定义正则表达式始终进行完整匹配，即使省略 `^` 和 `$` 也是如此。

目录捕获的占位符值会被匹配到的后代节点复用；每个重复目录都有各自独立的捕获值。

## 开发

```bash
bun run quality
bun run build
```

工作区可以独立运行，不存在指向 Daedalus 的路径依赖或工作区依赖。实现复制自原 Daedalus 工具及其直接 Anatomy 依赖。Schema 包包含 CLI 所需的完整 Anatomy 接口，与 Anatomy 无关的 Daedalus 产品领域不属于此独立项目。原始 Daedalus 仓库位于本工作区之外，本项目不会修改它。

## 发布

必须先发布包含一键安装器的新 `anatomy-cli` 版本，上面的包仓库安装命令才会具有对应行为。现有 `0.0.2` 版本发布于该功能之前。请勿在新版发布前部署包含一键安装说明的首页。

根包有意设置为私有。发布 CLI 时，先登录 npm，再使用 Bun 发布应用工作区；Bun 会在打包时替换本地 `workspace:` 依赖，`prepack` 钩子会生成 Node.js 包：

```bash
cd apps/anatomy-cli
bun publish --access public
```

包的两个 `bin` 入口必须保持独立：`anatomy-cli` 默认进入安装器，`anatomy` 进入检查器。发布时应同时包含三个构建文件（`main.js`、`index.js`、`install-main.js`）和 `bin/` 下的启动文件。无需单独的安装器包或安装生命周期脚本。
