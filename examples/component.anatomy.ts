import { z } from "zod";
import { defineAnatomy } from "../src/core/anatomy.js";

export default defineAnatomy({
  name: "react-component",
  schema: z.object({
    name: z.string().regex(/^[A-Z]/),
    files: z.object({
      component: z.string().endsWith(".tsx"),
      test: z.string().endsWith(".test.tsx"),
      story: z.string().endsWith(".stories.tsx"),
      index: z.literal("index.ts"),
    }),
  }),
  description: "React component folder structure",
});
