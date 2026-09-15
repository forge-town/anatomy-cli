import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scanAnatomy } from "./scanAnatomy.js";
import { queryAnatomyBundle } from "./queryAnatomyBundle.js";
import { validateAnatomyBundle } from "./validateAnatomyBundle.js";
import {
  AnatomyScanOutcomeSchema,
  AnatomyBundleQueryOutcomeSchema,
} from "@anatomy-cli/schemas";

const load = () =>
  JSON.parse(
    readFileSync(
      resolve(
        import.meta.dirname,
        "../../../../apps/anatomy-cli/anatomies/db-schema.bundle.json",
      ),
      "utf8",
    ),
  );
const file = (name: string) => ({ kind: "file" as const, name });
const dir = (name: string, children: any[] = []) => ({
  kind: "directory" as const,
  name,
  children,
});
const domain = (name: string) =>
  dir(name, [file("index.ts"), file(`${name}.table.ts`)]);
const target = () =>
  dir("db-schema", [
    file("package.json"),
    file("tsconfig.json"),
    dir("src", [
      file("index.ts"),
      dir("tables", [file("index.ts"), domain("accounts"), domain("billing")]),
      dir("relations", [file("index.ts")]),
    ]),
  ]);
const definition = (b: any, key: string) =>
  b.definitions.find((d: any) => d.key === key).definition;
const check = (
  bundle: any,
  tree = target(),
  sources?: Record<string, string>,
) =>
  scanAnatomy({
    bundle,
    target: tree,
    coverage: { status: "complete" },
    sources,
  });
const at = (tree: any, path: string): any =>
  path
    .split("/")
    .reduce((n, p) => n.children.find((c: any) => c.name === p), tree);
const codes = (r: Awaited<ReturnType<typeof scanAnatomy>>) =>
  r.status === "error"
    ? r.diagnostics.map((d) => d.code)
    : r.issues.map((d) => d.code);

describe("portable directory compositions", () => {
  /** @summary Show the Domain directory in an independent view
   * @description Given: Table Domain has an explicit domain root.
   * When: The maintainer queries its root.
   * Then: The result includes that directory and its own children.
   */
  it("[AC-01] independently describes the Domain root", () => {
    const b = load();
    b.root = "table-domain";
    const r = queryAnatomyBundle({ bundle: b, path: "." });
    expect(AnatomyBundleQueryOutcomeSchema.safeParse(r).success).toBe(true);
    expect(r).toMatchObject({
      status: "resolved",
      rules: [
        {
          origin: {
            definitionKey: "table-domain",
            rulePath: "/structure/root",
          },
          node: { kind: "directory", name: { value: "<domain>" } },
        },
      ],
    });
    if (r.status !== "error")
      expect(r.rules[0]?.node).toHaveProperty(
        "children",
        expect.arrayContaining([
          expect.objectContaining({
            name: { type: "literal", value: "index.ts" },
          }),
        ]),
      );
  });
  /** @summary Scan repeated Domain roots without a second wrapper
   * @description Given: Two valid table domains share one definition.
   * When: The maintainer scans the package.
   * Then: Both pass without accounts/accounts nesting.
   */
  it("[AC-02][AC-03][AC-05][AC-19] scans the five-definition package", async () => {
    const r = await check(load());
    expect(r).toMatchObject({
      status: "completed",
      conforms: true,
      issues: [],
    });
    expect(AnatomyScanOutcomeSchema.safeParse(r).success).toBe(true);
  });
  it("[AC-04] blocks no table domains", async () => {
    const t = target();
    at(t, "src/tables").children = [file("index.ts")];
    expect(codes(await check(load(), t))).toContain("missing_required");
  });
  it("[AC-06] blocks an existing empty relation domain", async () => {
    const t = target();
    at(t, "src/relations").children.push(dir("accounts", [file("index.ts")]));
    const r = await check(load(), t);
    expect(r).toMatchObject({ status: "completed", conforms: false });
    if (r.status === "completed")
      expect(r.issues[0]).toMatchObject({
        origin: { definitionKey: "relation-domain" },
        entryPath: "src/relations/accounts",
      });
  });
  it.each([
    "package.json",
    "src/index.ts",
    "src/tables/index.ts",
    "src/tables/accounts/index.ts",
  ])("[AC-07] attributes missing %s", async (path) => {
    const t = target();
    const parts = path.split("/");
    const name = parts.pop();
    const parent = parts.length ? at(t, parts.join("/")) : t;
    parent.children = parent.children.filter((e: any) => e.name !== name);
    const r = await check(load(), t);
    expect(codes(r)).toContain("missing_required");
    if (r.status === "completed")
      expect(r.issues[0]!.origin.sourceNodeId).toBeNull();
  });
  it.each([
    dir("users"),
    file("users.table.type-test.ts"),
    file("users.type-test.table.ts"),
  ])("[AC-08][AC-09] rejects extra entry $name", async (extra) => {
    const t = target();
    at(t, "src/tables/accounts").children.push(extra);
    const before = JSON.stringify(t);
    expect(codes(await check(load(), t))).toContain("unexpected_entry");
    expect(JSON.stringify(t)).toBe(before);
  });
  it("[AC-10] does not require relations for every table or equal domains", async () => {
    const t = target();
    at(t, "src/relations").children.push(
      dir("cross", [file("index.ts"), file("external.relation.ts")]),
    );
    expect(
      await check(load(), t, {
        "src/relations/cross/external.relation.ts":
          "import { accounts } from '../../tables/accounts/accounts.table.js';",
      }),
    ).toMatchObject({ conforms: true });
  });
  it("[AC-11] accepts a diamond dependency", () => {
    const b = load();
    const relations = definition(b, "relations-class");
    relations.structure.root.children[1].ref = "table-domain";
    expect(validateAnatomyBundle(b).status).toBe("valid");
  });
  it.each(["db-schema-package", "tables-class"])(
    "[AC-12] rejects cycle to %s",
    async (ref) => {
      const b = load();
      const n = definition(b, "tables-class").structure.root.children[1];
      n.ref = ref;
      n.name = { type: "placeholder", value: "<domain>" };
      const r = await check(b);
      expect(codes(r)).toContain("composition_cycle");
      if (r.status === "error")
        expect(
          r.diagnostics.find((d) => d.code === "composition_cycle")?.chain
            ?.length,
        ).toBeGreaterThan(1);
    },
  );
  it("[AC-13] validates absent optional references", async () => {
    const b = load();
    definition(b, "relations-class").structure.root.children[1].ref =
      "unavailable";
    const r = await check(b);
    expect(codes(r)).toContain("unavailable_reference");
    expect(r).toHaveProperty("conforms", null);
  });
  it.each(["composition", "directory"])(
    "[AC-14] rejects overlapping %s ownership",
    async (kind) => {
      const b = load();
      const nodes = definition(b, "tables-class").structure.root.children;
      nodes.push(
        kind === "composition"
          ? {
              kind,
              ref: "table-domain",
              quantity: "zero_or_more",
              policyOverrides: {},
            }
          : {
              kind,
              name: { type: "literal", value: "accounts" },
              quantity: "exactly_one",
              policyOverrides: {},
              children: [],
            },
      );
      expect(codes(await check(b))).toContain("ambiguous_mount");
    },
  );
  it("[AC-15] keeps distinct deterministic identities and original pointers", async () => {
    const b = load();
    const t = target();
    for (const name of ["accounts", "billing"])
      at(t, `src/tables/${name}`).children.shift();
    const a = await check(b, t);
    const c = await check(b, t);
    expect(a).toEqual(c);
    if (a.status === "completed") {
      expect(a.issues).toHaveLength(2);
      expect(new Set(a.issues.map((i) => i.issueKey)).size).toBe(2);
      expect(a.issues.map((i) => i.origin.rulePath)).toEqual([
        "/structure/root/children/0",
        "/structure/root/children/0",
      ]);
      expect(a.issues.map((i) => i.mounts.at(-1)?.mountPath).sort()).toEqual([
        "src/tables/accounts",
        "src/tables/billing",
      ]);
    }
  });
  it("[AC-16] preserves child blocking policies", async () => {
    const b = load();
    definition(b, "tables-class").structure.root.children[1].policyOverrides = {
      missingRequired: "warn",
    };
    const t = target();
    at(t, "src/tables/accounts").children.shift();
    const r = await check(b, t);
    if (r.status !== "completed") throw new Error(JSON.stringify(r));
    expect(r.issues[0]).toMatchObject({
      severity: "block",
      policyOrigin: {
        origin: {
          definitionKey: "table-domain",
          rulePath: "/structure/defaultPolicies",
        },
      },
    });
  });
  it("[AC-17] mounts named contents definitions", async () => {
    const b = load();
    const d = definition(b, "table-domain");
    d.structure = {
      rootMode: "contents",
      defaultPolicies: d.structure.defaultPolicies,
      root: { children: d.structure.root.children },
    };
    definition(b, "tables-class").structure.root.children[1].name = {
      type: "placeholder",
      value: "<domain>",
    };
    expect(await check(b)).toMatchObject({ conforms: true });
  });
  it("[AC-18] validates an independent target root name", async () => {
    const b = load();
    b.root = "table-domain";
    definition(b, b.root).structure.root.name = {
      type: "literal",
      value: "accounts",
    };
    expect(codes(await check(b, domain("billing")))).toEqual(["name_mismatch"]);
  });
  it("[AC-20] returns completed for structural nonconformance", async () => {
    expect(await check(load(), dir("db-schema", []))).toMatchObject({
      status: "completed",
      conforms: false,
    });
  });
  it("[AC-21] rejects incomplete trees", async () => {
    expect(
      await scanAnatomy({
        bundle: load(),
        target: target(),
        coverage: {
          status: "incomplete",
          reason: "provider truncated",
          paths: ["src"],
        },
      }),
    ).toMatchObject({
      status: "error",
      conforms: null,
      diagnostics: [{ code: "incomplete_tree" }],
    });
  });
  it("[AC-22] requires source for selected export rules", async () => {
    const b = load();
    b.root = "table-domain";
    definition(b, b.root).structure.root.children[1].exports = {
      name: "file_stem",
      policy: "block",
    };
    expect(codes(await check(b, domain("accounts")))).toEqual([
      "source_unavailable",
    ]);
    expect(
      codes(
        await check(b, domain("accounts"), {
          "accounts.table.ts": "export const wrong = 1",
        }),
      ),
    ).toContain("export_kind_mismatch");
  });
  it.each(["duplicate", "missing-root", "root-mode", "invalid-name"])(
    "[AC-23] rejects invalid bundle %s",
    async (kind) => {
      const b = load();
      if (kind === "duplicate") b.definitions.push(b.definitions[0]);
      if (kind === "missing-root") b.root = "absent";
      if (kind === "root-mode")
        definition(b, b.root).structure.rootMode = "unknown";
      if (kind === "invalid-name")
        definition(b, "table-domain").structure.root.name.value = "../bad";
      expect(await check(b)).toMatchObject({ status: "error", conforms: null });
    },
  );
  it.each([dir(".."), file("a/b"), file("index.ts")])(
    "[AC-23] rejects invalid tree $name",
    async (e) => {
      const t = target();
      at(t, "src").children.push(e);
      expect(codes(await check(load(), t))).toContain("invalid_tree");
    },
  );
  it("[AC-24] returns both mount and referenced root", () => {
    const r = queryAnatomyBundle({
      bundle: load(),
      path: "src/tables/accounts",
    });
    expect(r.status).toBe("resolved");
    if (r.status !== "error")
      expect(
        r.rules.map((r) => [r.origin.definitionKey, r.origin.rulePath]),
      ).toEqual([
        ["tables-class", "/structure/root/children/1"],
        ["table-domain", "/structure/root"],
      ]);
  });
  it("queries descendants using fresh child captures", () => {
    const r = queryAnatomyBundle({
      bundle: load(),
      path: "src/tables/accounts/accounts.table.ts",
    });
    expect(r.status).toBe("resolved");
    expect(AnatomyBundleQueryOutcomeSchema.safeParse(r).success).toBe(true);
    if (r.status !== "error")
      expect(r.rules[0]?.origin.definitionKey).toBe("table-domain");
  });
  it("[AC-27] rejects object cycles without overflowing", async () => {
    const t: any = target();
    t.children.push(t);
    expect(codes(await check(load(), t))).toEqual(["resource_limit_exceeded"]);
  });
  it("ignores absent references in unreachable definitions without crashing", async () => {
    const b = load();
    b.definitions.push({
      key: "unused",
      definition: {
        ...definition(b, "relations-class"),
        structure: {
          ...definition(b, "relations-class").structure,
          root: {
            children: [
              {
                kind: "composition",
                ref: "absent",
                name: { type: "literal", value: "mount" },
                quantity: "optional",
              },
            ],
          },
        },
      },
    });
    expect(await check(b)).toMatchObject({ conforms: true });
  });
});

describe("composition boundary regressions", () => {
  it("keeps an index file out of a domain mount even if the mount is declared first", async () => {
    const b = load();
    definition(b, "tables-class").structure.root.children.reverse();
    expect(await check(b)).toMatchObject({ conforms: true });
  });
  it("attributes a wrong-kind mount to its parent", async () => {
    const t = target();
    at(t, "src").children = at(t, "src").children.map((e: any) =>
      e.name === "tables" ? file("tables") : e,
    );
    const r = await check(load(), t);
    expect(r).toMatchObject({
      status: "completed",
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "nesting_mismatch",
          origin: expect.objectContaining({
            definitionKey: "db-schema-package",
          }),
        }),
      ]),
    });
  });
  it("does not suppress ordinary duplicate names just because another mount exists", () => {
    const b = load();
    const nodes = definition(b, "tables-class").structure.root.children;
    nodes.push({ ...nodes[0] });
    expect(validateAnatomyBundle(b).status).toBe("error");
  });
  it("rejects two same-literal mounts at execution with an ambiguity diagnostic", async () => {
    const b = load();
    const nodes = definition(b, "db-schema-package").structure.root.children[2]
      .children;
    nodes.push({ ...nodes[1] });
    expect(codes(await check(b))).toContain("ambiguous_mount");
  });
  it("preserves child bindings independently of the parent's binding with the same name", async () => {
    const b = load();
    definition(b, "tables-class").structure.bindings = {
      domain: { pattern: "not-a-real-domain" },
    };
    definition(b, "table-domain").structure.bindings = {
      domain: { format: "camelCase" },
    };
    expect(await check(b)).toMatchObject({ conforms: true });
    expect(
      queryAnatomyBundle({
        bundle: b,
        path: "src/tables/accounts/accounts.table.ts",
      }),
    ).toMatchObject({ status: "resolved" });
  });
  it("attributes ordinary inherited overrides to the original ancestor", async () => {
    const b = load();
    definition(b, "table-domain").structure.root.policyOverrides = {
      unexpectedEntry: "warn",
    };
    const t = target();
    at(t, "src/tables/accounts").children.push(file("extra.ts"));
    const r = await check(b, t);
    if (r.status !== "completed") throw new Error(JSON.stringify(r));
    expect(r.issues[0]).toMatchObject({
      severity: "warn",
      policyOrigin: {
        origin: { definitionKey: "table-domain", rulePath: "/structure/root" },
        policy: "unexpectedEntry",
      },
    });
  });
  it("allows duplicate node IDs in different definitions", async () => {
    const b = load();
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    definition(b, "table-domain").structure.root.id = id;
    definition(b, "relation-domain").structure.root.id = id;
    expect(await check(b)).toMatchObject({ conforms: true });
  });
  it("checks source functions through the shared lazy analyzer", async () => {
    const b = load();
    b.root = "table-domain";
    const d = definition(b, b.root);
    d.structure.root.children = [
      {
        kind: "file",
        name: { type: "literal", value: "getUser.ts" },
        quantity: "exactly_one",
        exports: { name: "file_stem", policy: "block" },
      },
    ];
    expect(
      await check(b, dir("accounts", [file("getUser.ts")]), {
        "getUser.ts":
          "export type User = {}; export function getUser() { return 1; }",
      }),
    ).toMatchObject({ conforms: true });
    expect(
      codes(
        await check(b, dir("accounts", [file("getUser.ts")]), {
          "getUser.ts": "export function getUser( {",
        }),
      ),
    ).toEqual(["source_analysis_error"]);
  });
  it("rejects an entry-reference override name and inline composition children", () => {
    for (const change of [
      { name: { type: "literal", value: "accounts" } },
      { children: [] },
    ]) {
      const b = load();
      Object.assign(
        definition(b, "tables-class").structure.root.children[1],
        change,
      );
      expect(validateAnatomyBundle(b).status).toBe("error");
    }
  });
  it("requires a root mode and rejects composition alternatives", () => {
    const b = load();
    const d = definition(b, "tables-class");
    delete d.structure.rootMode;
    expect(validateAnatomyBundle(b).status).toBe("error");
    const c = load();
    definition(c, "tables-class").structure.root.children = [
      {
        kind: "one_of",
        minimumMatches: 1,
        maximumMatches: 1,
        alternatives: [
          { kind: "composition", ref: "table-domain", quantity: "exactly_one" },
          {
            kind: "file",
            name: { type: "literal", value: "index.ts" },
            quantity: "exactly_one",
          },
        ],
      },
    ];
    expect(validateAnatomyBundle(c).status).toBe("error");
  });
  it("does not emit partial findings when a later source is absent", async () => {
    const b = load();
    definition(b, "table-domain").structure.root.children[1].exports = {
      name: "file_stem",
      policy: "block",
    };
    const r = await check(b, target(), {
      "src/tables/accounts/accounts.table.ts": "export const wrong=1",
    });
    expect(r).toMatchObject({ status: "error", conforms: null });
    expect(r).not.toHaveProperty("issues");
  });
  it("keeps identities invariant under input permutations", async () => {
    const b = load();
    const t = target();
    at(t, "src/tables/accounts").children.shift();
    const first = await check(b, t);
    b.definitions.reverse();
    t.children.reverse();
    at(t, "src/tables").children.reverse();
    expect(await check(b, t)).toEqual(first);
  });
});

describe("SDK execution budgets", () => {
  it("limits bundle definition count", () => {
    const b = load();
    const template = definition(b, "relations-class");
    b.definitions = Array.from({ length: 129 }, (_, i) => ({
      key: `definition-${i}`,
      definition: {
        ...template,
        structure: { ...template.structure, root: { children: [] } },
      },
    }));
    b.root = "definition-0";
    expect(validateAnatomyBundle(b)).toMatchObject({
      status: "error",
      diagnostics: [{ code: "resource_limit_exceeded" }],
    });
  });
  it("limits the longest reference path even through shared definitions", () => {
    const b = load();
    const template = definition(b, "relations-class");
    b.definitions = Array.from({ length: 35 }, (_, i) => ({
      key: `definition-${i}`,
      definition: {
        ...template,
        structure: {
          ...template.structure,
          root: {
            children:
              i < 34
                ? [
                    {
                      kind: "composition",
                      ref: `definition-${i + 1}`,
                      name: { type: "literal", value: "child" },
                      quantity: "optional",
                    },
                  ]
                : [],
          },
        },
      },
    }));
    b.root = "definition-0";
    expect(validateAnatomyBundle(b)).toMatchObject({
      status: "error",
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "resource_limit_exceeded" }),
      ]),
    });
  });
  it("limits UTF-8 bytes per source before source parsing", async () => {
    expect(
      codes(
        await check(load(), target(), { "big.ts": "中".repeat(1_666_667) }),
      ),
    ).toEqual(["resource_limit_exceeded"]);
  });
  it("limits total source bytes", async () => {
    const sources = Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [
        `file-${i}.ts`,
        "x".repeat(4_000_001),
      ]),
    );
    expect(codes(await check(load(), target(), sources))).toEqual([
      "resource_limit_exceeded",
    ]);
  });
  it("keeps root and immediate child policy overrides in root queries", () => {
    const b = load();
    b.root = "table-domain";
    definition(b, b.root).structure.root.policyOverrides = {
      unexpectedEntry: "warn",
    };
    expect(queryAnatomyBundle({ bundle: b, path: "." })).toMatchObject({
      status: "resolved",
      rules: [{ policies: { unexpectedEntry: "warn" } }],
    });
    b.root = "tables-class";
    definition(b, b.root).structure.root.children[0].policyOverrides = {
      missingRequired: "warn",
    };
    expect(queryAnatomyBundle({ bundle: b, path: "." })).toMatchObject({
      status: "resolved",
      rules: expect.arrayContaining([
        expect.objectContaining({
          policies: expect.objectContaining({ missingRequired: "warn" }),
        }),
      ]),
    });
  });
  it.each(["schemaVersion", "bundleVersion"])(
    "rejects obsolete %s fields instead of selecting a compatibility branch",
    async (field) => {
      const b = load();
      if (field === "schemaVersion") definition(b, b.root).structure[field] = 1;
      else b[field] = 1;
      expect(codes(await check(b))).toEqual(["invalid_bundle"]);
    },
  );
  it("returns scan and query outcomes without version selectors", async () => {
    const b = load();
    const scan = await check(b);
    const query = queryAnatomyBundle({ bundle: b, path: "." });
    expect(scan).not.toHaveProperty("contractVersion");
    expect(query).not.toHaveProperty("contractVersion");
  });
});
