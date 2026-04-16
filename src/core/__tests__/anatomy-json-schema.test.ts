import { describe, it, expect } from "vitest";
import { defineAnatomyFromSchema } from "../anatomy.js";
import { examine } from "../examine.js";
import { skeleton } from "../skeleton.js";

const componentJsonSchema = {
  title: "tsx-component",
  description: "TSX 组件解剖学",
  type: "object" as const,
  properties: {
    componentName: { type: "string" as const, pattern: "^[A-Z][a-zA-Z0-9]*$" },
    displayName: { type: "string" as const },
    exportType: { type: "string" as const, enum: ["default", "named", "both"], default: "named" },
    memo: { type: "boolean" as const, default: false },
  },
  required: ["componentName", "exportType", "memo"],
  additionalProperties: false,
};

describe("defineAnatomyFromSchema (JSON Schema)", () => {
  it("should create an anatomy from JSON Schema", () => {
    const anatomy = defineAnatomyFromSchema(componentJsonSchema);

    expect(anatomy.name).toBe("tsx-component");
    expect(anatomy.description).toBe("TSX 组件解剖学");
  });

  it("should validate valid data via examine", () => {
    const anatomy = defineAnatomyFromSchema(componentJsonSchema);
    const result = examine(anatomy, {
      componentName: "UserCard",
      exportType: "named",
      memo: false,
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid data via examine", () => {
    const anatomy = defineAnatomyFromSchema(componentJsonSchema);
    const result = examine(anatomy, {
      componentName: "userCard",
      exportType: "wildcard",
      memo: "yes",
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should generate skeleton with defaults", () => {
    const anatomy = defineAnatomyFromSchema(componentJsonSchema);
    const result = skeleton(anatomy);

    expect(result).toHaveProperty("componentName");
    expect(result).toHaveProperty("exportType");
    expect(result).toHaveProperty("memo");
  });

  it("should expose toJSONSchema that returns the original schema", () => {
    const anatomy = defineAnatomyFromSchema(componentJsonSchema);
    const schema = anatomy.toJSONSchema();

    expect(schema.title).toBe("tsx-component");
    expect(schema.properties).toHaveProperty("componentName");
  });

  it("should use 'unnamed' as name when title is absent", () => {
    const anatomy = defineAnatomyFromSchema({
      type: "object" as const,
      properties: { name: { type: "string" as const } },
      required: ["name"],
    });

    expect(anatomy.name).toBe("unnamed");
  });
});
