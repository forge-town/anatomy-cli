import { z } from "zod/v4";

export const AnatomyModelConfigSchema = z.strictObject({
  provider: z.literal("openai-compatible").default("openai-compatible"),
  baseUrl: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "Use an HTTP(S) base URL without credentials, query or fragment"),
  model: z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/),
  apiKeyEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).default("ANATOMY_API_KEY"),
  timeoutMs: z.number().int().min(1_000).max(300_000).default(60_000),
  jsonMode: z.boolean().default(true),
});
export type AnatomyModelConfig = z.infer<typeof AnatomyModelConfigSchema>;
