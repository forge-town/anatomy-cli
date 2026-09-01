# 第一次检查

Anatomy CLI 的最小调用需要一个定义文件和一个目标目录：

```bash
anatomy-cli \
  --definition ./path/to/anatomy.json \
  --target ./path/to/project
```

`--target` 默认为当前目录，也可以把定义文件作为第一个位置参数传入：

```bash
anatomy-cli ./path/to/anatomy.json --target ./src
```

## 使用仓库内置示例

仓库提供了可以立即试跑的定义：

```bash
bun run anatomy \
  --definition ./packages/anatomy-cli-config/src/anatomies/zod-schema.anatomy.json \
  --target ./packages/schemas/src/anatomy
```

检查通过时会看到 `conforms` 结果。若目标目录包含定义中要求的缺失或多余条目，输出会列出对应 finding。

## 忽略目录

用 `--ignore` 忽略不参与检查的目录名；参数可以重复，也可以用逗号分隔：

```bash
anatomy-cli \
  --definition ./anatomy.json \
  --target . \
  --ignore node_modules,.git \
  --ignore dist
```

## 给脚本使用 JSON

```bash
anatomy-cli --definition ./anatomy.json --target ./src --format json > anatomy-result.json
```

接下来可以阅读 [Anatomy 核心概念](/concepts/anatomy)，了解如何编写自己的定义。
