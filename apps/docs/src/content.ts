export type DocsEntry = {
  slug: string;
  section: "Guide" | "Reference" | "Concepts" | "Development";
  title: string;
  summary: string;
  blocks: Array<
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "code"; language: string; code: string }
    | { type: "list"; items: string[] }
  >;
};

export const docsEntries: DocsEntry[] = [
  {
    slug: "installation",
    section: "Guide",
    title: "安装 Anatomy CLI",
    summary: "从发布包开始，在一分钟内完成第一次结构检查。",
    blocks: [
      { type: "paragraph", text: "Anatomy CLI 提供 anatomy-cli 和 anatomy 两个命令别名。选择与你的环境匹配的安装方式即可。" },
      { type: "heading", text: "macOS / Linux" },
      { type: "code", language: "bash", code: "curl -fsSL https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.sh | sh" },
      { type: "heading", text: "Windows PowerShell" },
      { type: "code", language: "powershell", code: "powershell -c \"irm https://raw.githubusercontent.com/forge-town/anatomy-cli/main/install.ps1 | iex\"" },
      { type: "heading", text: "包管理器" },
      { type: "code", language: "bash", code: "npm install -g --ignore-scripts anatomy-cli\npnpm add -g --ignore-scripts anatomy-cli\nbun add -g --ignore-scripts anatomy-cli" },
      { type: "paragraph", text: "安装完成后运行 anatomy-cli --help 确认命令可用。发布包需要 Node.js 18+；从源码开发需要 Bun 1.3+。" },
    ],
  },
  {
    slug: "quick-start",
    section: "Guide",
    title: "第一次检查",
    summary: "用一个定义文件和一个目标目录跑通完整检查。",
    blocks: [
      { type: "paragraph", text: "Anatomy CLI 的最小调用需要一个定义文件和一个目标目录。--target 默认是当前目录。" },
      { type: "code", language: "bash", code: "anatomy-cli \\\n  --definition ./path/to/anatomy.json \\\n  --target ./path/to/project" },
      { type: "heading", text: "忽略目录" },
      { type: "code", language: "bash", code: "anatomy-cli --definition ./anatomy.json --target . \\\n  --ignore node_modules,.git --ignore dist" },
      { type: "heading", text: "给脚本使用 JSON" },
      { type: "code", language: "bash", code: "anatomy-cli --definition ./anatomy.json --target ./src --format json > anatomy-result.json" },
    ],
  },
  {
    slug: "ci",
    section: "Guide",
    title: "CI 集成",
    summary: "稳定的退出码和 JSON 输出，让结构检查自然进入 pull request。",
    blocks: [
      { type: "paragraph", text: "退出码 0 表示符合定义，1 表示存在 block finding，2 表示运行错误或定义无效。" },
      { type: "code", language: "yaml", code: "name: anatomy\n\non:\n  pull_request:\n\njobs:\n  check-structure:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: bun install --frozen-lockfile\n      - run: bun run anatomy -- --definition ./anatomy.json --target ./src --format json" },
    ],
  },
  {
    slug: "cli",
    section: "Reference",
    title: "命令与参数",
    summary: "CLI 的完整参数表和常用组合。",
    blocks: [
      { type: "code", language: "text", code: "Usage: anatomy-cli --definition <file> [options]" },
      { type: "list", items: ["--definition, -d：Anatomy Draft 或 Version JSON 文件，必填。", "--target, -t：要检查的目标目录，默认当前目录。", "--format：human 或 json，默认 human。", "--ignore：逗号分隔的名称，可重复传入。", "--help, -h：显示帮助。"] },
      { type: "code", language: "bash", code: "anatomy-cli -d ./anatomy.json -t ./src\nanatomy-cli -d ./anatomy.json --format json\nanatomy-cli -d ./anatomy.json --ignore node_modules,dist,.git" },
    ],
  },
  {
    slug: "output",
    section: "Reference",
    title: "输出与退出码",
    summary: "Human 输出适合本地查看，JSON 输出适合归档和自动化。",
    blocks: [
      { type: "heading", text: "Human 输出" },
      { type: "paragraph", text: "默认输出会展示检查是否符合、finding 数量和每条 finding 的路径与消息。" },
      { type: "heading", text: "JSON 输出" },
      { type: "code", language: "bash", code: "anatomy-cli --definition ./anatomy.json --format json" },
      { type: "list", items: ["0：conforms 为 true，检查通过。", "1：至少一条 block finding，阻止合并。", "2：运行错误或定义无效，修复配置后重试。"] },
    ],
  },
  {
    slug: "anatomy",
    section: "Concepts",
    title: "Anatomy 核心概念",
    summary: "用可版本化的 JSON 定义描述仓库结构。",
    blocks: [
      { type: "paragraph", text: "CLI 会将 Anatomy 定义与目标目录的确定性文件树对照，检查名称、层级、数量、one-of 和策略。" },
      { type: "list", items: ["名称：文件或目录是否命名正确。", "层级：条目是否位于期望的父目录下。", "数量：必需、可选或限定数量的条目是否满足。", "one-of：多个候选结构中是否恰好选择允许的一种。", "策略：finding 可以标记为 block、warn 或 allow。"] },
      { type: "code", language: "text", code: "Anatomy Draft\n     ↓\n读取并校验定义\n     ↓\n收集目标目录文件树\n     ↓\n名称 / 嵌套 / 数量 / one-of 检查\n     ↓\nhuman 或 JSON 结果" },
    ],
  },
  {
    slug: "definition",
    section: "Concepts",
    title: "定义示例",
    summary: "从一个最小的服务目录定义开始。",
    blocks: [
      { type: "code", language: "json", code: "{\n  \"name\": \"service-files\",\n  \"version\": \"1.0.0\",\n  \"structure\": {\n    \"type\": \"directory\",\n    \"name\": \"services\",\n    \"children\": [\n      { \"type\": \"file\", \"name\": \"index.ts\", \"quantity\": \"exactly-one\" },\n      { \"type\": \"file\", \"name\": \"service.ts\", \"quantity\": \"exactly-one\" }\n    ]\n  }\n}" },
      { type: "paragraph", text: "定义文件建议放在 anatomy/ 或 config/anatomies/ 等仓库可见的位置，并在 CI 中用明确的相对路径引用。" },
    ],
  },
  {
    slug: "contributing",
    section: "Development",
    title: "仓库布局与开发",
    summary: "了解 monorepo 中 CLI、引擎、schema 和定义配置的职责。",
    blocks: [
      { type: "list", items: ["apps/anatomy-cli：CLI 入口、参数解析与文件系统适配。", "packages/anatomy：Anatomy 树工具与 conformance engine。", "packages/schemas：Anatomy Draft 的运行时 schema。", "packages/anatomy-cli-config：可复用的示例定义。"] },
      { type: "code", language: "bash", code: "bun install --frozen-lockfile\nbun run quality\nbun run docs:dev\nbun run docs:build" },
    ],
  },
];

export const getDocsEntry = (slug: string) => docsEntries.find((entry) => entry.slug === slug);
