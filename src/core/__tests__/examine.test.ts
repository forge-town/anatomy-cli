import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineAnatomy } from "../anatomy.js";
import { examine } from "../examine.js";

const componentAnatomy = defineAnatomy({
  name: "react-component",
  schema: z.object({
    name: z.string().regex(/^[A-Z]/),
    files: z.object({
      component: z.string().endsWith(".tsx"),
      test: z.string().endsWith(".test.tsx"),
      index: z.literal("index.ts"),
    }),
  }),
  description: "React component structure",
});

describe("examine", () => {
  it("should return success for valid spec", () => {
    const result = examine(componentAnatomy, {
      name: "UserCard",
      files: {
        component: "UserCard.tsx",
        test: "UserCard.test.tsx",
        index: "index.ts",
      },
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return errors for invalid spec", () => {
    const result = examine(componentAnatomy, {
      name: "userCard", // lowercase - violates regex
      files: {
        component: "UserCard.tsx",
        test: "UserCard.test.tsx",
        index: "index.ts",
      },
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should return detailed error with path and message", () => {
    const result = examine(componentAnatomy, {
      name: "UserCard",
      files: {
        component: "UserCard.js", // wrong extension
        test: "UserCard.test.tsx",
        index: "index.ts",
      },
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toHaveProperty("path");
    expect(result.errors[0]).toHaveProperty("message");
  });

  it("should return errors for missing required fields", () => {
    const result = examine(componentAnatomy, {
      name: "UserCard",
      // missing files
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should include anatomy name in result", () => {
    const result = examine(componentAnatomy, { name: "UserCard" });

    expect(result.anatomyName).toBe("react-component");
  });

  it("should return typed data on success", () => {
    const result = examine(componentAnatomy, {
      name: "UserCard",
      files: {
        component: "UserCard.tsx",
        test: "UserCard.test.tsx",
        index: "index.ts",
      },
    });

    if (result.success) {
      expect(result.data.name).toBe("UserCard");
      expect(result.data.files.component).toBe("UserCard.tsx");
    }
  });
});
