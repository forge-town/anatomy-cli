import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineAnatomy } from "../anatomy.js";
import { skeleton } from "../skeleton.js";

describe("skeleton", () => {
  it("should generate skeleton with string defaults as empty strings", () => {
    const anatomy = defineAnatomy({
      name: "simple",
      schema: z.object({
        name: z.string(),
        label: z.string(),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ name: "", label: "" });
  });

  it("should generate skeleton with number defaults as 0", () => {
    const anatomy = defineAnatomy({
      name: "metric",
      schema: z.object({
        value: z.number(),
        count: z.number(),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ value: 0, count: 0 });
  });

  it("should generate skeleton with boolean defaults as false", () => {
    const anatomy = defineAnatomy({
      name: "flags",
      schema: z.object({
        enabled: z.boolean(),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ enabled: false });
  });

  it("should generate skeleton with nested objects", () => {
    const anatomy = defineAnatomy({
      name: "nested",
      schema: z.object({
        name: z.string(),
        config: z.object({
          port: z.number(),
          host: z.string(),
        }),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({
      name: "",
      config: { port: 0, host: "" },
    });
  });

  it("should use default values when defined in schema", () => {
    const anatomy = defineAnatomy({
      name: "with-defaults",
      schema: z.object({
        name: z.string().default("unnamed"),
        port: z.number().default(3000),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ name: "unnamed", port: 3000 });
  });

  it("should handle optional fields as undefined", () => {
    const anatomy = defineAnatomy({
      name: "optional",
      schema: z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ name: "", description: undefined });
  });

  it("should handle nullable fields as null", () => {
    const anatomy = defineAnatomy({
      name: "nullable",
      schema: z.object({
        name: z.string(),
        meta: z.string().nullable(),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ name: "", meta: null });
  });

  it("should handle arrays as empty arrays", () => {
    const anatomy = defineAnatomy({
      name: "with-array",
      schema: z.object({
        tags: z.array(z.string()),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ tags: [] });
  });

  it("should handle enum with first value as default", () => {
    const anatomy = defineAnatomy({
      name: "with-enum",
      schema: z.object({
        status: z.enum(["draft", "published", "archived"]),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ status: "draft" });
  });

  it("should allow overrides", () => {
    const anatomy = defineAnatomy({
      name: "overridable",
      schema: z.object({
        name: z.string(),
        port: z.number(),
      }),
    });

    const result = skeleton(anatomy, { name: "MyApp" });
    expect(result).toEqual({ name: "MyApp", port: 0 });
  });

  it("should handle literal values", () => {
    const anatomy = defineAnatomy({
      name: "with-literal",
      schema: z.object({
        type: z.literal("config"),
        index: z.literal("index.ts"),
      }),
    });

    const result = skeleton(anatomy);
    expect(result).toEqual({ type: "config", index: "index.ts" });
  });
});
