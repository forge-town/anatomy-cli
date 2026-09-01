# 命令与参数

```text
Usage: anatomy-cli --definition <file> [options]
```

## 参数

| 参数 | 简写 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `--definition <file>` | `-d` | — | Anatomy Draft 或 Version JSON 文件，必填 |
| `--target <directory>` | `-t` | `.` | 要检查的目标目录 |
| `--format <format>` | — | `human` | `human` 或 `json` |
| `--ignore <paths>` | — | `[]` | 逗号分隔的名称，可重复传入 |
| `--help` | `-h` | — | 显示帮助 |

## 常用组合

```bash
# 使用短参数
anatomy-cli -d ./anatomy.json -t ./src

# 面向 CI 的机器可读输出
anatomy-cli -d ./anatomy.json --format json

# 忽略构建产物与依赖目录
anatomy-cli -d ./anatomy.json --ignore node_modules,dist,.git
```

定义文件是唯一必需输入；如果省略 `--target`，CLI 会检查当前工作目录。
