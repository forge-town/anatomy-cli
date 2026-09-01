import { z } from "zod/v4";

import { AnatomyPoliciesSchema } from "./AnatomyPolicy.schema";
import { AnatomyNodeSchema } from "./AnatomyNode.schema";

/** Anatomy 必须满足的递归文件系统结构契约。 */
export const AnatomyStructureSchema = z.object({
  /** 结构文档的格式版本，用于后续兼容迁移。 */
  schemaVersion: z.literal(1),
  /** 所有节点未单独覆盖时采用的默认策略。 */
  defaultPolicies: AnatomyPoliciesSchema,
  /** 不代表真实目录的虚拟根节点。 */
  root: z.object({
    /** 位于 Anatomy 顶层的结构节点。 */
    children: z.array(AnatomyNodeSchema),
  }),
});

export type AnatomyStructure = z.infer<typeof AnatomyStructureSchema>;
