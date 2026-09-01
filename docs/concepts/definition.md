# 定义示例

下面是一个最小的 Anatomy Draft 片段，用来表达一个服务目录需要包含 `index.ts` 和 `service.ts`：

```json
{
  "name": "service-files",
  "version": "1.0.0",
  "structure": {
    "type": "directory",
    "name": "services",
    "children": [
      { "type": "file", "name": "index.ts", "quantity": "exactly-one" },
      { "type": "file", "name": "service.ts", "quantity": "exactly-one" }
    ]
  }
}
```

实际项目可以继续嵌套目录、声明可选节点，或通过 one-of 表达互斥布局。完整字段以 `packages/schemas` 中的运行时 schema 为准。

## 放在哪里

建议将定义文件放在仓库可见的位置，例如 `anatomy/` 或 `config/anatomies/`，并在 CI 中用明确的相对路径引用：

```bash
anatomy-cli --definition ./anatomy/service-files.json --target ./src/services
```

定义文件本身也会先进行结构校验；无效定义会返回退出码 `2`。
