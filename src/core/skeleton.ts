import { z } from "zod";
import type { Anatomy } from "./anatomy.js";

interface JSONSchemaNode {
  type?: string;
  properties?: Record<string, JSONSchemaNode>;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  items?: JSONSchemaNode;
  [key: string]: unknown;
}

function isZodType(schema: unknown): schema is z.ZodType {
  return (
    schema !== null &&
    typeof schema === "object" &&
    "_zod" in (schema as Record<string, unknown>)
  );
}

function getDefaultForZod(schema: z.ZodType): unknown {
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
        result[key] = getDefaultForZod(value);
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

function getDefaultForJSONSchema(node: JSONSchemaNode): unknown {
  if (node.default !== undefined) {
    return node.default;
  }
  if (node.const !== undefined) {
    return node.const;
  }

  switch (node.type) {
    case "string":
      if (node.enum && Array.isArray(node.enum) && node.enum.length > 0) {
        return node.enum[0];
      }
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object": {
      const result: Record<string, unknown> = {};
      if (node.properties) {
        for (const [key, value] of Object.entries(node.properties)) {
          result[key] = getDefaultForJSONSchema(value);
        }
      }
      return result;
    }
    default:
      return undefined;
  }
}

export function skeleton<T>(
  anatomy: Anatomy<T>,
  overrides?: Partial<T>
): T {
  const base = isZodType(anatomy.schema)
    ? getDefaultForZod(anatomy.schema) as Record<string, unknown>
    : getDefaultForJSONSchema(anatomy.schema as JSONSchemaNode) as Record<string, unknown>;

  if (overrides) {
    return { ...base, ...overrides } as T;
  }

  return base as T;
}
