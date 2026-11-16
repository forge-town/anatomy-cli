import { describe, expect, it } from "vitest";
import { AnatomyDraftInputSchema } from "@anatomy-cli/schemas";
import { checkAnatomy } from "./checkAnatomy.js";
import { evaluateName } from "./evaluateName.js";
import { queryAnatomy } from "./queryAnatomy.js";
import { resolveAnatomyExportName } from "./resolveAnatomyExportName.js";
import { validateAnatomyForPublish } from "./validateAnatomyForPublish.js";
const entry = (value: string) => ({
  id: crypto.randomUUID(),
  kind: "file" as const,
  name: { type: "placeholder" as const, value },
  quantity: "exactly_one" as const,
  policyOverrides: {},
});
const definition = (template = "<Domain:PascalCase><Name?>Service") =>
  AnatomyDraftInputSchema.parse({
    name: "Templates",
    purpose: "Reuse named captures at arbitrary positions",
    structure: {
      rootMode: "contents",
      bindings: { Domain: { pattern: "[a-z][a-z0-9]*" }, Name: { pattern: "[A-Za-z0-9]+" } },
      defaultPolicies: {
        missingRequired: "block",
        unexpectedEntry: "block",
        nameMismatch: "block",
        nestingMismatch: "block",
      },
      root: {
        children: [
          {
            ...entry("_<Domain>"),
            kind: "directory",
            quantity: "one_or_more",
            children: [
              {
                ...entry(template),
                kind: "directory",
                quantity: "one_or_more",
                children: [entry("<Domain:PascalCase><Name?>.service.ts")],
              },
            ],
          },
        ],
      },
    },
  });
const domain = (name: string, ...services: string[]) => ({
  kind: "directory" as const,
  name: "_" + name,
  children: services.map((name) => ({
    kind: "directory" as const,
    name: name + "Service",
    children: [{ kind: "file" as const, name: name + ".service.ts" }],
  })),
});
describe("generic name templates", () => {
  it.each([
    ["<Domain:PascalCase><Name>Service", "AccountAccessService"],
    ["<Name><Domain:PascalCase>Service", "AccessAccountService"],
    ["<Name>Service<Domain:PascalCase>", "AccessServiceAccount"],
  ])("reuses a domain at any position: %s", (template, name) => {
    expect(
      evaluateName(
        entry(template),
        name,
        { Domain: "account" },
        { Name: { format: "PascalCase" } },
      ),
    ).toEqual({ kind: "match", captures: { Name: "Access" } });
  });
  it("captures and reuses multiple names with delimiters", () => {
    expect(evaluateName(entry("<Left>-<Right>-<Left>.ts"), "foo-bar-foo.ts", {}, {})).toEqual({
      kind: "match",
      captures: { Left: "foo", Right: "bar" },
    });
    expect(evaluateName(entry("<Left>-<Right>-<Left>.ts"), "foo-bar-other.ts", {}, {}).kind).toBe(
      "binding_consistency_mismatch",
    );
  });
  it("accepts independent domains, empty remainders and acronym casing", () => {
    expect(
      checkAnatomy(definition(), [
        domain("account", "AccountAccess", "AccountOther"),
        domain("github", "GitHubCredentials", "Github"),
        domain("trace", "Trace"),
        domain("user", "Users"),
      ])._unsafeUnwrap(),
    ).toMatchObject({ conforms: true, issues: [] });
  });
  it.each([
    domain("account", "AdminUsers"),
    {
      kind: "directory" as const,
      name: "_account",
      children: [
        {
          kind: "directory" as const,
          name: "AccountAccessService",
          children: [{ kind: "file" as const, name: "AccountOther.service.ts" }],
        },
      ],
    },
  ])("rejects inconsistent ancestor/domain or service captures", (tree) => {
    expect(checkAnatomy(definition(), [tree])._unsafeUnwrap().conforms).toBe(false);
  });
  it("fails closed for unavailable formatted references", () => {
    expect(
      validateAnatomyForPublish({
        ...definition(),
        structure: {
          ...definition().structure,
          root: { children: [entry("<Missing:PascalCase>.ts")] },
        },
      }).isErr(),
    ).toBe(true);
    expect(evaluateName(entry("<Missing:PascalCase>.ts"), "Anything.ts", {}, {}).kind).not.toBe(
      "match",
    );
  });
  it.each(["<Domain:Unknown>.ts", "<Name><Other>.ts", "<Name><Name:PascalCase>.ts", "<Broken.ts", "<>.ts"])(
    "rejects invalid or ambiguous template %s",
    (template) => {
      const input = definition();
      input.structure.root.children = [entry(template)];
      expect(validateAnatomyForPublish(input).isErr()).toBe(true);
    },
  );
  it("retains normal nonempty capture and exact consistency semantics", () => {
    expect(evaluateName(entry("<Name>.ts"), ".ts", {}, {}).kind).toBe("none");
    expect(evaluateName(entry("<Name>.ts"), "user.ts", { Name: "User" }, {}).kind).toBe(
      "binding_consistency_mismatch",
    );
    expect(
      evaluateName(entry("<Name?>.ts"), ".ts", { Name: "" }, { Name: { format: "PascalCase" } }),
    ).toEqual({ kind: "match", captures: {} });
  });
  it("checks transformed format without reapplying canonical binding constraints", () => {
    expect(
      evaluateName(
        entry("<Domain:PascalCase>.ts"),
        "Account.ts",
        { Domain: "account" },
        { Domain: { pattern: "[a-z]+" } },
      ).kind,
    ).toBe("match");
    expect(
      evaluateName(entry("<Domain:PascalCase>.ts"), "account.ts", { Domain: "account" }, {}).kind,
    ).toBe("binding_format_mismatch");
  });
  it("renders every placeholder in query and function export rules", () => {
    const result = queryAnatomy(
      definition(),
      "_account/AccountAccessService/AccountAccess.service.ts",
    )._unsafeUnwrap();
    expect(result).toMatchObject({
      status: "resolved",
      captures: { Domain: "account", Name: "Access" },
      rules: [{ expectedName: "AccountAccess.service.ts" }],
    });
    expect(
      resolveAnatomyExportName(
        { name: { type: "placeholder", value: "make<Domain:PascalCase><Name>" }, policy: "block" },
        "ignored.ts",
        { Domain: "account", Name: "Access" },
      ),
    ).toBe("makeAccountAccess");
  });
  it("validates all exported placeholders, including the second one", () => {
    const file = {
      ...entry("<Name>.ts"),
      exports: {
        name: { type: "placeholder" as const, value: "<Name><Missing>" },
        policy: "block" as const,
      },
    };
    const input = definition();
    input.structure.root.children = [file];
    expect(validateAnatomyForPublish(input).isErr()).toBe(true);
  });
});

it("keeps canonical binding constraints when reusing an existing capture", () => {
  expect(evaluateName(entry("<Name>.ts"),"user.ts",{Name:"user"},{Name:{format:"PascalCase"}}).kind).toBe("binding_format_mismatch");
});

it("renders references captured earlier in a delimited expression", () => {
  expect(evaluateName(entry("<Name>-<Name:PascalCase>.ts"),"account-Account.ts",{},{Name:{format:"camelCase"}})).toEqual({kind:"match",captures:{Name:"account"}});
});

it("rejects adjacent transformed references whose capture boundary is unknown", () => {
  const input=definition();input.structure.root.children=[entry("<Name><Name:PascalCase>.ts")];
  expect(validateAnatomyForPublish(input).isErr()).toBe(true);
  expect(evaluateName(entry("<Name><Name:PascalCase>.ts"),"accountAccount.ts",{},{}).kind).toBe("none");
});
