# 输出与退出码

## Human 输出

默认输出适合本地查看，会展示检查是否符合、finding 数量和每条 finding 的路径与消息。

## JSON 输出

传入 `--format json` 后，CLI 输出稳定的 JSON 结构，适合存档或交给 CI 脚本：

```bash
anatomy-cli --definition ./anatomy.json --format json
```

结果来自同一个检查引擎，因此 human 与 JSON 只改变表现层，不改变判定。

## 退出码

| Code | 含义 | CI 建议 |
| ---: | --- | --- |
| `0` | `conforms: true` | 通过 |
| `1` | 至少一条 `block` finding | 阻止合并 |
| `2` | 运行错误或定义无效 | 修复配置后重试 |

::: warning 注意
`warn` 与 `allow` finding 不会让进程返回 `1`；只有 `block` 级别会阻断检查。
:::
