---
name: generate-anatomy
description: Use when 用户指定一个文件夹，希望由当前 Agent 理解目录结构、命名规律和项目规范，生成或明确要求更新 anatomy.json；结合实际样本归纳可复用规则，并使用 Anatomy 校验结果交付配置，适用于现有项目首次接入和模块规范提炼。
---

# 生成 Anatomy

使用宿主 Agent 的模型完成目录理解和规则归纳。

- 开始时读取 [生成流程](references/workflow.md)，确定目录、规范依据和输出位置。
- 编写规则前读取 [格式规范](references/anatomy-format.md)；当前 CLI 可提供实际 JSON Schema。
- 归纳重复命名时参考 [Service 示例](references/example.anatomy.json)，仅复用适合目标目录的规则。
- 交付前按 [完成清单](references/checklist.md) 验证文件及实际检查结果。
