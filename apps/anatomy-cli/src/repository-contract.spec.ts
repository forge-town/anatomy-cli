import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { anatomyRulePaths, checkAnatomy, planAnatomyCheck, type AnatomyFileTreeEntry } from "@anatomy-cli/anatomy/core";
import { collectGitFileTree } from "./collectGitFileTree";
import { collectSourceExports } from "./collectSourceExports";
import { readAnatomyDefinition } from "./readAnatomyDefinition";

const root = resolve(import.meta.dirname, "../../..");
const load = async () => {
  const definition = (await readAnatomyDefinition(resolve(root, "anatomy.json")))._unsafeUnwrap();
  const entries = (await collectGitFileTree(root))._unsafeUnwrap();
  const plan = planAnatomyCheck(definition, entries)._unsafeUnwrap();
  const exports = (await collectSourceExports(root, plan.exportChecks))._unsafeUnwrap();
  return { definition, entries, exports, plan };
};

const removeFile = (entries: AnatomyFileTreeEntry[], path: string): AnatomyFileTreeEntry[] => {
  const [name, ...rest] = path.split("/");
  return entries.flatMap((entry) => entry.name !== name ? [entry]
    : rest.length === 0 ? []
    : entry.kind === "directory" ? [{ ...entry, children: removeFile(entry.children, rest.join("/")) }] : [entry]);
};

describe("whole repository Anatomy contract", () => {
  it("covers every Git-visible project file with a strict explicit rule", async () => {
    const { definition, entries, exports } = await load();
    expect(checkAnatomy(definition, entries, exports)._unsafeUnwrap().issues).toEqual([]);
    expect(definition.structure.defaultPolicies).toEqual({ missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" });
    for (const { node } of anatomyRulePaths(definition).values()) {
      expect(node.kind).not.toBe("one_of");
      if (node.kind === "one_of") continue;
      expect(node.name.type).toBe("literal");
      expect(node.quantity).toBe("exactly_one");
      expect(node.policyOverrides).toEqual({});
      if (node.kind === "file" && node.exports) expect(node.exports.policy).toBe("block");
    }
  });

  it("blocks additions and missing files in every workspace and in repository infrastructure", async () => {
    const { definition, entries, exports } = await load();
    for (const path of ["package.json", ".github/workflows/ci.yml", "apps/anatomy-cli/src/runAnatomyCli.ts",
      "apps/docs/src/pages/HomePage.tsx", "packages/anatomy/src/core/checkAnatomy.ts",
      "packages/schemas/src/anatomy/AnatomyDraftInputSchema.ts", "packages/anatomy-cli-config/src/anatomies/service.anatomy.json"]) {
      const result = checkAnatomy(definition, removeFile(entries, path), exports)._unsafeUnwrap();
      expect(result.conforms, path).toBe(false);
      expect(result.issues.some((issue) => issue.code === "missing_required" && issue.path === dirname(path) && issue.message.includes(basename(path))), path).toBe(true);
    }
    const addAtEveryDirectory = (tree: AnatomyFileTreeEntry[]): AnatomyFileTreeEntry[] => [
      ...tree.map((entry) => entry.kind === "directory" ? { ...entry, children: addAtEveryDirectory(entry.children) } : entry),
      { kind: "file", name: "undeclared.ts" },
    ];
    const result = checkAnatomy(definition, addAtEveryDirectory(entries), exports)._unsafeUnwrap();
    const directories = [...anatomyRulePaths(definition).values()].filter(({ node }) => node.kind === "directory");
    expect(result.issues.filter((issue) => issue.code === "unexpected_entry")).toHaveLength(directories.length + 1);
  });

  it("blocks wrong function names and additional runtime exports for every selected source file", async () => {
    const { definition, entries, exports, plan } = await load();
    expect(plan.exportChecks.length).toBeGreaterThan(90);
    for (const check of plan.exportChecks) {
      const changed = new Map(exports);
      changed.set(check.path, [{ name: "wrongExportName", kind: "function" }]);
      const result = checkAnatomy(definition, entries, changed)._unsafeUnwrap();
      expect(result.issues.some((issue) => issue.path === check.path && issue.code === "export_name_mismatch"), check.path).toBe(true);
      changed.set(check.path, [...exports.get(check.path)!, { name: "extra", kind: "value" }]);
      expect(checkAnatomy(definition, entries, changed)._unsafeUnwrap().conforms, check.path).toBe(false);
    }
  });

  it("requires a reviewed role for every source file without a function rule", async () => {
    const { definition } = await load();
    const coverage = JSON.parse(await readFile(resolve(root, "anatomy.coverage.json"), "utf8")) as {
      exceptions: Record<string, { role: string; reason: string; runtimeExports: string[] }>;
    };
    const used = new Set<string>();
    const visit = async (nodes: typeof definition.structure.root.children, parent = "") => {
      for (const node of nodes) {
        if (node.kind === "one_of") continue;
        const path = parent ? `${parent}/${node.name.value}` : node.name.value;
        if (node.kind === "directory") { await visit(node.children, path); continue; }
        if (!/\.[cm]?[jt]sx?$/.test(path)) continue;
        if (node.exports) { expect(coverage.exceptions[path], path).toBeUndefined(); continue; }
        const exception = coverage.exceptions[path];
        expect(exception, `${path} has neither a function contract nor a reviewed role`).toBeDefined();
        if (!exception) continue;
        used.add(path);
        expect(exception.reason.length, path).toBeGreaterThan(15);
        const source = ts.createSourceFile(path, await readFile(resolve(root, path), "utf8"), ts.ScriptTarget.Latest, true);
        const hasExport = (node: ts.Node) => ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword);
        const declarations = source.statements.filter(hasExport);
        const assignments = source.statements.filter(ts.isExportAssignment);
        const reexports = source.statements.filter(ts.isExportDeclaration);
        const runtimeNames = declarations.flatMap((node) => {
          if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return [];
          if (ts.getModifiers(node as ts.HasModifiers)?.some((item) => item.kind === ts.SyntaxKind.DefaultKeyword)) return ["default"];
          if (ts.isVariableStatement(node)) return node.declarationList.declarations.map((item) => item.name.getText(source));
          if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isEnumDeclaration(node) || ts.isModuleDeclaration(node)) return [node.name?.getText(source) ?? "default"];
          return [];
        });
        runtimeNames.push(...assignments.map(() => "default"));
        for (const statement of reexports) {
          if (!statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
            runtimeNames.push(...statement.exportClause.elements.filter((item) => !item.isTypeOnly).map((item) => item.name.text));
          }
        }
        expect(runtimeNames.sort(), `${path} changed its reviewed public exports`).toEqual(exception.runtimeExports);
        if (["test", "entrypoint", "types"].includes(exception.role)) {
          expect(declarations.every((node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)), path).toBe(true);
          expect(assignments, path).toHaveLength(0);
          expect(reexports, path).toHaveLength(0);
        } else if (exception.role === "barrel") {
          expect(source.statements.every((node) => ts.isExportDeclaration(node) && !node.exportClause &&
            node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")), path).toBe(true);
        } else if (["schema", "data", "class"].includes(exception.role)) {
          const runtime = declarations.filter((node) => !ts.isTypeAliasDeclaration(node) && !ts.isInterfaceDeclaration(node));
          expect(runtime, path).toHaveLength(1);
          expect(assignments, path).toHaveLength(0);
          expect(reexports, path).toHaveLength(0);
          const declaration = runtime[0]!;
          if (exception.role === "class") {
            expect(ts.isClassDeclaration(declaration), path).toBe(true);
            if (ts.isClassDeclaration(declaration)) expect(declaration.name?.text, path).toBe(basename(path, ".ts"));
          } else {
            expect(ts.isVariableStatement(declaration), path).toBe(true);
            if (ts.isVariableStatement(declaration)) {
              expect(declaration.declarationList.declarations, path).toHaveLength(1);
              const variable = declaration.declarationList.declarations[0]!;
              expect(variable.name.getText(source), path).toBe(basename(path).replace(/\.[^.]+$/, ""));
              expect(variable.initializer && (ts.isArrowFunction(variable.initializer) || ts.isFunctionExpression(variable.initializer)), path).toBe(false);
            }
          }
        } else {
          expect(["framework", "generated"], path).toContain(exception.role);
          expect(declarations.some((node) => ts.isFunctionDeclaration(node) || (ts.isVariableStatement(node) &&
            node.declarationList.declarations.some((item) => item.initializer && (ts.isArrowFunction(item.initializer) || ts.isFunctionExpression(item.initializer))))), path).toBe(false);
        }
      }
    };
    await visit(definition.structure.root.children);
    expect([...used].sort()).toEqual(Object.keys(coverage.exceptions).sort());
  });

  it("keeps focused CLI and Schema contracts identical to their root contract subtrees", async () => {
    const document = JSON.parse(await readFile(resolve(root, "anatomy.json"), "utf8"));
    const subtree = (path: string) => path.split("/").reduce((nodes, name) => nodes.find((node: { name: { value: string } }) => node.name.value === name).children, document.structure.root.children);
    for (const [path, contract] of [
      ["apps/anatomy-cli/src", "apps/anatomy-cli/anatomies/cli-source.anatomy.json"],
      ["packages/schemas", "packages/schemas/anatomy.json"],
    ]) {
      const focused = JSON.parse(await readFile(resolve(root, contract!), "utf8"));
      expect(focused.structure.root.children).toEqual(subtree(path!));
    }
  });
});
