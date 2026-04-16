import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineAnatomy } from "../anatomy.js";

describe("defineAnatomy", () => {
  it("should create an anatomy with name, schema, and description", () => {
    const anatomy = defineAnatomy({
      name: "react-component",
      schema: z.object({
        name: z.string(),
        files: z.object({
          component: z.string(),
          test: z.string(),
        }),
      }),
      description: "React component structure",
    });

    expect(anatomy.name).toBe("react-component");
    expect(anatomy.description).toBe("React component structure");
    expect(anatomy.schema).toBeDefined();
  });

  it("should create an anatomy without description", () => {
    const anatomy = defineAnatomy({
      name: "simple",
      schema: z.object({ name: z.string() }),
    });

    expect(anatomy.name).toBe("simple");
    expect(anatomy.description).toBeUndefined();
  });

  it("should expose a parse method that validates data", () => {
    const anatomy = defineAnatomy({
      name: "test",
      schema: z.object({ name: z.string() }),
    });

    const result = anatomy.parse({ name: "hello" });
    expect(result).toEqual({ name: "hello" });
  });

  it("should throw on invalid data via parse", () => {
    const anatomy = defineAnatomy({
      name: "test",
      schema: z.object({ name: z.string() }),
    });

    expect(() => anatomy.parse({ name: 123 })).toThrow();
  });

  it("should expose a safeParse method that returns success/error", () => {
    const anatomy = defineAnatomy({
      name: "test",
      schema: z.object({ name: z.string() }),
    });

    const success = anatomy.safeParse({ name: "hello" });
    expect(success.success).toBe(true);

    const failure = anatomy.safeParse({ name: 123 });
    expect(failure.success).toBe(false);
  });

  it("should expose toJSONSchema that returns standard JSON Schema", () => {
    const anatomy = defineAnatomy({
      name: "test",
      schema: z.object({
        name: z.string(),
        port: z.number().default(3000),
      }),
    });

    const jsonSchema = anatomy.toJSONSchema();

    expect(jsonSchema).toHaveProperty("$schema");
    expect(jsonSchema.type).toBe("object");
    expect(jsonSchema.properties).toHaveProperty("name");
    expect(jsonSchema.properties).toHaveProperty("port");
    expect(jsonSchema.properties.port.default).toBe(3000);
    expect(jsonSchema.required).toContain("name");
  });

  it("should include anatomy metadata in JSON Schema", () => {
    const anatomy = defineAnatomy({
      name: "my-component",
      schema: z.object({ name: z.string() }),
      description: "My component anatomy",
    });

    const jsonSchema = anatomy.toJSONSchema();

    expect(jsonSchema.title).toBe("my-component");
    expect(jsonSchema.description).toBe("My component anatomy");
  });
});
