import { z } from "zod";
import { defineAnatomy } from "../src/core/anatomy.js";

export default defineAnatomy({
  name: "react-component",
  description: "React 组件文件夹规范：每个组件必须包含组件文件、测试、Story 和 barrel export",
  schema: z.object({
    name: z.string().regex(/^[A-Z][a-zA-Z0-9]*$/),
    files: z.object({
      component: z.string().endsWith(".tsx"),
      test: z.string().endsWith(".test.tsx"),
      story: z.string().endsWith(".stories.tsx"),
      index: z.literal("index.ts"),
    }),
    props: z
      .array(
        z.object({
          name: z.string(),
          type: z.enum(["string", "number", "boolean", "ReactNode", "function"]),
          required: z.boolean(),
        })
      )
      .optional(),
  }),
});
