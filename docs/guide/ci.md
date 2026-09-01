# CI 集成

Anatomy CLI 的退出码适合直接放进 CI：

| 退出码 | 含义 |
| --- | --- |
| `0` | 目标符合定义 |
| `1` | 存在 `block` 级别 finding |
| `2` | 定义文件或目标目录无法读取，或定义结构无效 |

## GitHub Actions 示例

```yaml
name: anatomy

on:
  pull_request:

jobs:
  check-structure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run anatomy -- \
          --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json \
          --target ./packages/schemas/src/anatomy \
          --format json
```

::: tip 让 CI 输出更有用
将 JSON 输出保存为 artifact，或交给后续脚本汇总；人类阅读的默认 human 输出更适合本地调试。
:::
