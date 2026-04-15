import { z } from "zod";

interface AnatomyConfig<T extends z.ZodType> {
  name: string;
  schema: T;
  description?: string;
}

interface Anatomy<T extends z.ZodType> {
  name: string;
  schema: T;
  description: string | undefined;
  parse: (data: unknown) => z.infer<T>;
  safeParse: (data: unknown) => z.SafeParseReturnType<unknown, z.infer<T>>;
}

export function defineAnatomy<T extends z.ZodType>(
  config: AnatomyConfig<T>
): Anatomy<T> {
  return {
    name: config.name,
    schema: config.schema,
    description: config.description,
    parse: (data: unknown) => config.schema.parse(data),
    safeParse: (data: unknown) => config.schema.safeParse(data),
  };
}
