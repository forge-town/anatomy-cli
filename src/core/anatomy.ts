import { z } from "zod";
import Ajv from "ajv";

interface JSONSchemaObject {
  $schema?: string;
  title?: string;
  description?: string;
  type?: string;
  properties?: Record<string, JSONSchemaObject>;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  pattern?: string;
  items?: JSONSchemaObject;
  additionalProperties?: boolean | JSONSchemaObject;
  [key: string]: unknown;
}

interface AnatomyConfig<T extends z.ZodType> {
  name: string;
  schema: T;
  description?: string;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
  error: undefined;
}

interface SafeParseError {
  success: false;
  data: undefined;
  error: { issues: Array<{ path: (string | number)[]; message: string }> };
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError;

export interface Anatomy<T = unknown> {
  name: string;
  schema: z.ZodType | JSONSchemaObject;
  description: string | undefined;
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => SafeParseResult<T>;
  toJSONSchema: () => JSONSchemaObject;
}

export function defineAnatomy<T extends z.ZodType>(
  config: AnatomyConfig<T>
): Anatomy<z.infer<T>> {
  return {
    name: config.name,
    schema: config.schema,
    description: config.description,
    parse: (data: unknown) => config.schema.parse(data),
    safeParse: (data: unknown) => {
      const result = config.schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data, error: undefined };
      }
      return {
        success: false,
        data: undefined,
        error: {
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
      };
    },
    toJSONSchema: () => {
      const jsonSchema = z.toJSONSchema(config.schema) as JSONSchemaObject;
      jsonSchema.title = config.name;
      if (config.description) {
        jsonSchema.description = config.description;
      }
      return jsonSchema;
    },
  };
}

export function defineAnatomyFromSchema(
  jsonSchema: JSONSchemaObject
): Anatomy<Record<string, unknown>> {
  const name = (jsonSchema.title as string) ?? "unnamed";
  const description = jsonSchema.description as string | undefined;

  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  const validate = ajv.compile(jsonSchema);

  return {
    name,
    schema: jsonSchema,
    description,
    parse: (data: unknown) => {
      const valid = validate(data);
      if (!valid) {
        const messages = (validate.errors ?? [])
          .map((e) => `${e.instancePath || "/"}: ${e.message}`)
          .join("; ");
        throw new Error(`Validation failed: ${messages}`);
      }
      return data as Record<string, unknown>;
    },
    safeParse: (data: unknown) => {
      const valid = validate(data);
      if (valid) {
        return { success: true, data: data as Record<string, unknown>, error: undefined };
      }
      const issues = (validate.errors ?? []).map((e) => ({
        path: e.instancePath
          ? e.instancePath.split("/").filter(Boolean).map((p) => (/^\d+$/.test(p) ? Number(p) : p))
          : [],
        message: e.message ?? "Validation error",
      }));
      return { success: false, data: undefined, error: { issues } };
    },
    toJSONSchema: () => {
      return {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        ...jsonSchema,
      };
    },
  };
}
