import { z } from "zod/v4";

/** Anatomy 条目名称的精确匹配或占位匹配表达式。 */
export const AnatomyNameExpressionSchema = z.discriminatedUnion("type", [
  z.object({
    /** 名称表达式类型：要求精确匹配固定名称。 */
    type: z.literal("literal"),
    /** 必须匹配的固定文件名。 */
    value: z.string().trim().min(1),
  }),
  z.object({
    /** 名称表达式类型：允许匹配语义占位符。 */
    type: z.literal("placeholder"),
    /** 描述允许名称的占位表达式。 */
    value: z.string().trim().min(3),
  }),
]);

export type AnatomyNameExpression = z.infer<typeof AnatomyNameExpressionSchema>;
