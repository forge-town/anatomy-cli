import { z } from "zod";

interface Anatomy<T extends z.ZodType> {
  name: string;
  schema: T;
}

function getDefaultForSchema(schema: z.ZodType): unknown {
  const def = (schema as unknown as { _zod: { def: { type: string; [key: string]: unknown } } })._zod.def;

  switch (def.type) {
    case "string":
      return "";
    case "number":
    case "float64":
    case "int32":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object": {
      const shape = def.shape as Record<string, z.ZodType>;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        result[key] = getDefaultForSchema(value);
      }
      return result;
    }
    case "enum": {
      const entries = def.entries as Record<string, string>;
      const values = Object.values(entries);
      return values.length > 0 ? values[0] : undefined;
    }
    case "default": {
      return def.defaultValue;
    }
    case "optional":
      return undefined;
    case "nullable":
      return null;
    case "literal": {
      const values = def.values as unknown[];
      return values.length > 0 ? values[0] : undefined;
    }
    default:
      return undefined;
  }
}

export function skeleton<T extends z.ZodType>(
  anatomy: Anatomy<T>,
  overrides?: Partial<z.infer<T>>
): z.infer<T> {
  const base = getDefaultForSchema(anatomy.schema) as Record<string, unknown>;

  if (overrides) {
    return { ...base, ...overrides } as z.infer<T>;
  }

  return base as z.infer<T>;
}
