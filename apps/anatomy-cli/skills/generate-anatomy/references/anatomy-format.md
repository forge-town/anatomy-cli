# Anatomy 单定义格式

根对象只包含 name、purpose、structure。name 为 1–120 字符；purpose 为最多 2000 字符的用途说明。structure 包含 rootMode、defaultPolicies、root，可选 bindings。此 skill 生成 contents 模式；root.children 直接对应被扫描目录的内容。

目录或文件节点包含 kind、name、quantity。目录 kind 为 directory，并有 children；文件 kind 为 file。name 对象使用 type 与 value：literal 精确匹配一个名称；placeholder 的值是单个目录或文件名模板，例如 <Name>Service.ts。不要把带路径分隔符的多级路径塞进一个 name。

quantity 可选 exactly_one、optional、one_or_more、zero_or_more。它表示该规则在同一父目录内匹配的数量，不表示整个递归树的数量。目录中的占位符会传给其后代；不同重复目录有各自绑定，不能把两个模块的名称混用。

bindings 是占位符名字到约束对象的映射。format 可选 PascalCase、camelCase、kebab-case、snake_case、SCREAMING_SNAKE_CASE，也可使用 pattern 完整匹配正则表达式。只给确实使用且有依据的占位符添加约束。

defaultPolicies 包含 missingRequired、unexpectedEntry、nameMismatch、nestingMismatch，值均为 block、warn 或 allow。节点可以有同名字段组成的 policyOverrides。新项目通常把缺少必需项和层级错误设为 block；已有项目策略应依据用户要求决定，不能静默忽略违规。

ID 可省略，读取时会生成。policyOverrides 的空对象可省略。不要创建 schemaVersion 字段或把 CLI/npm 的版本号写入定义。

文件可以使用 exports 声明且仅声明一个具名函数导出：name 为 file_stem 时取去掉最后扩展名的文件名；也可使用 literal 或 placeholder 名称对象。type-only 导出不计数。此约束需要源码或用户规范支撑，不能只从文件扩展名猜测。

需要互斥候选结构时，one_of 节点包含 id（可省略）、kind、minimumMatches、maximumMatches、alternatives；数量上下界和选项必须一致。证据不足时先明确需求，不随意添加排他关系。

当前 CLI 的 anatomy skills schema 输出完整输入 JSON Schema，可用于核对高级字段及当前版本。仅有 JSON 语法通过不代表规则语义有效，最终还需运行 Anatomy 检查。示例使用共享 Service 命名，应用时根据目标样本决定数量与策略。
