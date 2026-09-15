# Anatomy

[English](./README.md) | **简体中文**

[anatomy.tools](https://anatomy.tools) 是一个开源工具，用于根据版本化的 Anatomy 定义验证仓库文件树。完整指南见 [anatomy.tools/docs](https://anatomy.tools/docs)。

## 工作区结构

- `apps/anatomy-cli` — 命令行接口与文件系统适配器
- `packages/anatomy` — 不可变 Anatomy 树工具与结构检查引擎
- `packages/schemas` — 带运行时校验的 Anatomy Draft Schema；`anatomy` 领域是此独立工作区的公开接口
- `packages/anatomy-cli-config` — 可复用的 Anatomy 定义示例

迁移保留了原有模块边界：Daedalus CLI 成为应用，树操作与检查引擎归入 `packages/anatomy`，`packages/schemas` 仅保留 Anatomy Schema 及其依赖。Daedalus 内部工作区别名已替换为独立的 `@anatomy-cli/*` 作用域。

结构规则使用确定性的文件树；可选的函数导出规则会对选中的 JavaScript / TypeScript 文件进行 AST 分析：

```text
JSON Anatomy Draft
        ↓
deterministic filesystem tree
        ↓
name / nesting / quantity / one-of checks
        ↓
optional function-export checks
        ↓
block · warn · allow result
```

## 环境要求

- Bun 1.3 或更新版本
- 通过 npm 或 pnpm 安装已发布 CLI 包时，需要 Node.js 24 或更新版本

仓库开发以 Bun 为主。发布的 CLI 会打包为独立的 Node.js 入口，从包仓库安装时不需要 Bun。

## 安装 Anatomy

从以下命令中选择**一条**运行一次，之后直接使用 `anatomy`：

```bash
npx anatomy-cli
pnpm dlx anatomy-cli
bunx anatomy-cli
```

一键安装器支持 macOS、Linux 和 Windows，需要 Node.js 24+。它将下载的 `anatomy-cli` 版本中已打包的独立 CLI 复制到 `~/.anatomy`，包管理器清理缓存后仍可使用。安装无需再次下载包、无需管理员权限，也不会修改项目依赖。包名保持为 `anatomy-cli`，日常使用的命令是 `anatomy`。

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
    "rootMode": "contents",
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

## 函数导出约束（源码运行）

文件规则可以显式开启源码导出检查。例如下面的文件节点要求 `getUser.ts` 只能有一个运行时导出，而且必须是名为 `getUser` 的具名函数：

```json
{
  "kind": "file",
  "name": { "type": "placeholder", "value": "<Method>.ts" },
  "quantity": "one_or_more",
  "exports": { "name": "file_stem" }
}
```

`file_stem` 仅去掉最后一个扩展名。如果文件规则是 `<Method>.method.ts`，改用 `"exports": { "name": { "type": "placeholder", "value": "<Method>" } }`。导出名的占位符必须已经由文件名或祖先目录捕获，不能另起一个无关绑定；也可使用 `{"type":"literal","value":"getUser"}` 明确指定导出名。导出规则的 `policy` 默认是 `block`，独立于结构策略。

支持具名函数声明、async/generator 函数、箭头函数和函数表达式，也支持本地 `export { implementation as getUser }`，检查的是对外导出的名称。类型别名、接口和纯类型导出不计入数量。默认导出、没有导出、多余运行时导出、导出非函数值都会违反规则。无法在本文件确定函数性质的导入/转导出和动态包装、声明文件、CommonJS 导出修改、语法错误返回运行错误（退出码 `2`）。源码只解析，不导入、不执行；这属于静态导出声明检查，不证明运行时行为和类型正确。

仅对匹配且声明了 `exports` 的文件读取源码，原有纯结构定义保持行为。查询模式返回 `expectedExport`，并在人类可读输出中展示要求，不分析源码。检查的导出诊断包含 `expectedExport`、`actualExports` 和原有 `rulePath`，错误码为 `export_count_mismatch`、`export_name_mismatch`、`export_kind_mismatch`。修改文件内容后重新运行同一条 `anatomy` 检查命令即可，无需额外开关。

纯引擎的 `planAnatomyCheck` 返回 `structuralResult` 和待分析的 `exportChecks`，规划结果不代表完整验证通过。调用 `checkAnatomy` 时传入以相对文件路径为键的导出分析 Map，才能同时执行结构与导出检查；缺少必要分析时返回 `AnatomySourceAnalysisError`。CLI 自动完成这两个步骤。CLI 构建产物已包含 TypeScript 解析器，这项能力需要后续发布新版后才能通过包管理器安装使用。

## Agent 工作流（源码运行）

修改前查询定义，修改后检查文件树。以下命令使用当前源码；查询接口需要后续发布新版 CLI 才能通过包管理器安装使用。

```bash
# 两次操作使用相同的目标根目录和定义。
# 查询路径相对于目标根目录，可以尚不存在。
bun run anatomy ./packages/services --query src/UserService/UserService.ts \
  --definition ./apps/anatomy-cli/anatomies/service-files.anatomy.json --format json

# Agent 创建或修改模块后：
bun run anatomy ./packages/services \
  --definition ./apps/anatomy-cli/anatomies/service-files.anatomy.json --format json
```

将 `./packages/services` 替换为仓库中实际存在的目录。省略 `--definition` 时，仍向上查找最近的 `anatomy.json`。定义的根节点始终描述传入的目标目录；在父目录找到定义不会改变这个对应关系。`--query .` 返回根约束。查询路径支持 Windows 相对路径分隔符，拒绝绝对路径和 `..` 路径段。查询会读取目标以发现文件系统错误，不创建文件或改写定义。

省略 `--format json` 时，直接显示文件要求、数量、继承名称、策略和 one-of 条件选择的可读摘要。摘要描述的是约束，不代表实际文件已通过检查。

查询 JSON 使用 `operation: "query"`，状态含义如下：

| 状态 | 含义 |
| --- | --- |
| `resolved` | 找到声明的规则，或正在查询根约束；不代表验证通过。 |
| `unmatched` | 在 `scopePath` 下没有匹配的节点规则；该父目录的 `unexpectedEntry` 策略仍然适用。未声明目录的后代不会被检查。 |
| `mismatch` | 名称、占位符绑定或中间路径的节点类型与定义冲突。 |
| `ambiguous` | 多条规则可能消费同一节点，需要查看 `matches` 和 `rules`；实际检查还取决于规则顺序、节点类型和同级条目。 |

响应包含定义及目标的绝对路径、有效策略、占位符捕获值、绑定约束、祖先数量约束、相关规则和所属 one-of 组。目录规则保留子树；可用 `captures` 替换后代中的继承占位符。one-of 的候选项是条件选择，不是全部必须创建的文件。数量、同级候选项和实际节点类型仍须在修改后执行检查。

检查 JSON 保留 `conforms`、`summary` 和原有诊断字段，包含 `operation: "check"`、定义及目标信息、`ignoredNames`。每条诊断新增 `rulePath`（定义中的 JSON Pointer）、`expected`（声明的节点）和 `actual`（实际条目摘要）。缺失节点与 one-of 诊断的 `actual` 列出受影响目录下的同级条目；意外节点的 `rulePath`、`expected` 为 null。用 `rulePath` 关联同一版定义的查询与检查：省略的 ID 每次解析都会重新生成，编辑定义后数组下标也可能变化。

查询完成时所有查询状态均返回退出码 `0`，Agent 应读取 `status` 再决定如何修改。检查仍以 `0` 表示没有阻断项、`1` 表示存在阻断项。运行错误返回 `2`；指定 `--format json` 时，stderr 输出 `operation: "error"` 的 JSON，stdout 不输出成功报告。定义缺失或无效、未知字段和目标不可读都属于错误，不能视为“没有约束”。未知定义字段现在会被拒绝，不再静默移除；需要修正拼写或使用当前规则。目标和定义参数用于明确检查范围。

查询描述声明的结构，不应用扫描忽略规则，因此 `--ignore` 只接受于检查模式。默认检查跳过符号链接以及 `node_modules`、`dist` 等生成目录，报告会列出忽略名称。结构检查通过仅覆盖已采集文件树与已执行规则；类型和行为须另行验证。

检查整个仓库可使用 `anatomy . --git-files`：需要 Git，包含所有已跟踪文件（即使被忽略规则匹配）及未被忽略的新文件。它读取当前工作区，已删除文件仍会报告缺失。此模式包含契约文件，不应用默认名称排除规则，拒绝与 `--ignore` 混用，遇到符号链接或子模块会报错。未跟踪且被忽略的本地产物、空目录不属于此文件清单。JSON 会标明 `fileSelection: "git"`，`ignoredNames` 为空。

## 开发

```bash
bun run anatomy:check
bun run quality
bun run build
```

本仓库通过 workspace 依赖使用自己的 CLI。根目录的 `anatomy.json` 逐项声明五个工作区及仓库基础设施的全部项目文件；函数和组件模块采用一文件一具名函数，导出名对应文件名。框架要求固定路径的 `router.tsx` 和 `-RootDocument.tsx` 使用显式名称映射。Schema 采用与导出同名的 `*Schema.ts` 文件，派生类型保留在同一文件。

其他源码按 Schema、常量、类、测试、barrel、入口及框架生成模块区分；`anatomy.coverage.json` 记录其职责、理由和精确导出列表，仓库测试会验证，不能无说明地跳过约束。`quality` 首先执行全仓 Anatomy 检查，再执行类型、lint、测试和 CLI 构建，PR CI 使用同一入口。新增、移动、删除文件的步骤见 `CONTRIBUTING.md`。本地根目录 `docs/` 产物继续排除在 Git 和扫描范围外。

工作区可以独立运行，不存在指向 Daedalus 的路径依赖或工作区依赖。实现复制自原 Daedalus 工具及其直接 Anatomy 依赖。Schema 包包含 CLI 所需的完整 Anatomy 接口，与 Anatomy 无关的 Daedalus 产品领域不属于此独立项目。原始 Daedalus 仓库位于本工作区之外，本项目不会修改它。

## 发布

`Publish npm packages` 在发版相关改动进入 `main` 后自动发布 patch。目前只递增
`0.0.x` 的第三位，不自动升级 minor 或 major。三个公开包使用同一版本，按
`@anatomy-cli/schemas` → `@anatomy-cli/anatomy` → `anatomy-cli` 的顺序发布；根包保持私有。

先在仓库 Actions Secrets 配置 `NPM_TOKEN`，授予三个包的无交互发布权限，首次发布
还需要创建 scope 包的权限。工作流使用 `.nvmrc` 中的 Node，运行 `bun run quality`，
独立安装打包后的 CLI 和 SDK 验证，再携带 provenance 发布。发布后回读 registry 的版本、
完整性和标签，并重新安装验证。版本计划、tarball 和消费验证结果保存在 Actions artifacts。

工作流进入 `main` 后，可以手动发布 canary：

```bash
gh workflow run publish-npm.yml --ref main -f channel=canary
```

Actions 页面也支持选择 `channel=stable`（默认）或 `channel=canary`。稳定版只允许从
`main` 发布；canary 可以选择功能分支。工作流尚未进入默认分支时，推送 `canary-*` Git
标签也能从对应提交触发 canary。版本形如 `0.0.4-canary.<run-id>.<attempt>`，只更新 npm
的 `canary` 标签，不更新 `latest`。安装命令为 `npm install anatomy-cli@canary`，SDK 为
`npm install @anatomy-cli/anatomy@canary @anatomy-cli/schemas@canary`。

稳定版取三个包在 registry 上最高的 `0.0.x` 再递增。同一源码提交的稳定版重跑会继续原版本，
不会重复递增；已发布产物冲突时失败。版本号和内部依赖精确版本只写入被忽略的根 `docs/`
下的临时打包副本，工作流不向 Git 提交版本修改，实际发布版本与源码提交以 registry 为准。

两个 `bin` 入口保持独立：`anatomy-cli` 默认进入安装器，`anatomy` 进入检查器。
发布产物同时包含 CLI 构建文件和 `bin/` 启动文件。

## 组合 Bundle 与 SDK

在仓库根目录先运行 `nvm install && nvm use`，再运行 `bun install && bun run build`。`.nvmrc` 锁定 Node 24.21.0，所有包要求 Node 24+，CI 使用同一固定版本。npm 版本可能落后于本地代码，构建不等于发布。

```bash
node apps/anatomy-cli/bin/anatomy.js /path/to/packages/db-schema \
  --bundle apps/anatomy-cli/anatomies/db-schema.bundle.json --format json

node apps/anatomy-cli/bin/anatomy.js /path/to/packages/db-schema \
  --bundle apps/anatomy-cli/anatomies/db-schema.bundle.json \
  --query src/tables/accounts --format json
```

`--bundle` 与 `--definition`、`--ignore` 互斥，可搭配 `--git-files` 使用完整的 Git 可见文件清单。普通文件系统模式沿用单定义扫描的默认忽略名称及符号链接排除规则；SDK 调用方自行提供清单并声明覆盖范围。退出码：符合结构为 0、阻断违规为 1、配置或执行错误为 2。

示例包含 Package、Tables Class、Relations Class、Table Domain、Relation Domain 五个独立定义。Domain 必须显示自身的目录：

```text
<domain>/
├── index.ts
└── <table>.table.ts  （一个或多个）
```

Class 通过 `{ "kind": "composition", "ref": "table-domain", "quantity": "one_or_more" }` 引用整个目录单元，不会生成 `accounts/accounts/` 两层目录。Tables 至少包含一个域；Relations 可以没有域，但已有关系域至少需要一个 `.relation.ts` 文件。额外子目录与 type-test 文件会被拒绝，扫描不会删除文件。允许跨域关系引用，结构规则不验证关系代码语义。

Bundle 使用逻辑根键 `root` 和 `definitions: [{ key, definition }]`。key 必须唯一，以小写字母开头，可包含数字和中划线。所有结构必须明确指定 `rootMode`：

- `entry`：root 是具名目录，数量为 `exactly_one`；引用继承根名，禁止重复指定 name，重复次数由引用的 quantity 控制。
- `contents`：root.children 描述目录内容；引用必须提供单段挂载 name。

composition 不允许内联 children、alternatives 或源码规则，也不允许出现在 one_of 的 alternatives 中。只维护一套当前契约，不设置格式版本字段或历史 Anatomy 版本；每次请求只使用调用方提供的定义快照。

构建后的 `@anatomy-cli/anatomy` 提供 `validateAnatomyBundle`、`scanAnatomy`、`queryAnatomyBundle`，`@anatomy-cli/schemas` 提供运行时 Schema 与派生类型。两个包均输出 ESM JavaScript 和 d.ts。调用示例：

```ts
const result = await scanAnatomy({
  bundle,
  target: { kind: 'directory', name: 'db-schema', children: completeTree },
  coverage: { status: 'complete' },
  sources: {}, // 仅源码规则需要；键为扫描根下的相对 POSIX 路径。
});
```

SDK 不读取文件系统、Git、数据库或网络，不执行目标源码；需要导出校验时才加载共享源码分析器。底层 checkAnatomy 匹配器接收规范化的 contents 规则与预先分析的源码导出 Map。

扫描完成时返回 completed、conforms、summary 和 issues；结构阻断是 completed + conforms=false。配置、依赖、输入或源码错误返回 error + conforms=null + diagnostics，不返回部分通过。诊断携带原始定义/规则指针、实际挂载链、捕获值、策略来源和稳定身份。缺失与因权限未提供的引用统一为 unavailable_reference。SDK 拒绝调用方声明的 incomplete 树，但不能证明调用方没有隐瞒清单缺口。

公开限额 `AnatomyResourceLimits`：128 个定义、100,000 个输入对象、输入嵌套深度 128、引用深度 32、10,000 个挂载实例、单份源码 5,000,000 UTF-8 字节、全部源码 20,000,000 字节。超限返回 resource_limit_exceeded。

`bun run quality` 包含打包后独立安装与实际 Node CLI/SDK 测试；测试需要访问 npm registry，消费样例保留在被忽略的根 docs/verification/cod-420/ 中。发布前核对 scope 权限、npm 版本和 schemas→core→CLI 依赖顺序，真正发布是单独操作。Daedalus 仍负责权限、业务 ID 映射、完整仓库快照、Findings 映射，以及 MCP 根 Anatomy 选择与扫描编排的贯通。
