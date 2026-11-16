import { posix } from "node:path";
import { ResultAsync } from "neverthrow";
import { AnatomyDependencyRequestSchema, type AnatomyDependencyIssue } from "@anatomy-cli/schemas";
import { AnatomySourceAnalysisError } from "../core/AnatomySourceAnalysisError.js";
import { dependencySourcePaths } from "../core/dependencySourcePaths.js";
import { matchesDependencyPath } from "../core/matchesDependencyPath.js";
import { AnatomyResourceLimits } from "../composition/AnatomyResourceLimits.js";

export const checkAnatomyDependencies = (input: unknown) => ResultAsync.fromPromise((async () => {
  const parsed = AnatomyDependencyRequestSchema.safeParse(input);
  if (!parsed.success) throw new AnatomySourceAnalysisError(".", `Invalid dependency request: ${parsed.error.message}`);
  const { config, files, sources, scope } = parsed.data;
  const selected = dependencySourcePaths(files, config, scope);
  let total = 0;
  for (const path of selected) {
    const source = sources[path];
    if (source === undefined) throw new AnatomySourceAnalysisError(path, `Source text required for dependency rules: ${path}`);
    const size = new TextEncoder().encode(source).length;
    total += size;
    if (size > AnatomyResourceLimits.sourceBytes || total > AnatomyResourceLimits.totalSourceBytes) throw new AnatomySourceAnalysisError(path, "Dependency source byte limit exceeded");
  }
  if (!selected.length) return [] as AnatomyDependencyIssue[];
  const { default: ts } = await import("typescript");
  const prefix = scope === "." ? "" : `${scope}/`;
  const paths = Object.fromEntries(Object.entries(config.aliases).map(([key, values]) => [key, values.map((v) => prefix + v)]));
  const options = { noLib: true, noResolve: true, types: [], allowJs: true, target: ts.ScriptTarget.Latest, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, baseUrl: "/", paths, resolveJsonModule: true };
  const inventory = new Set(files.map((p) => `/${p}`));
  const directories = new Set<string>(["/"]);
  for (const file of inventory) {
    let parent = posix.dirname(file);
    while (parent !== "/") { directories.add(parent); parent = posix.dirname(parent); }
  }
  const host: import("typescript").CompilerHost = {
    getSourceFile: (filename, version) => {
      const text = sources[filename.replace(/^\//, "")];
      return text === undefined ? undefined : ts.createSourceFile(filename, text, version, true);
    },
    fileExists: (filename) => inventory.has(posix.normalize(filename)),
    readFile: (filename) => sources[filename.replace(/^\//, "")],
    directoryExists: (path) => directories.has(posix.normalize(path).replace(/\/+$/, "") || "/"),
    getDirectories: () => [], getDefaultLibFileName: () => "", writeFile: () => undefined,
    getCurrentDirectory: () => "/", getCanonicalFileName: (p) => p, useCaseSensitiveFileNames: () => true, getNewLine: () => "\n", realpath: (p) => p,
  };
  const program = ts.createProgram(selected.map((p) => `/${p}`), options, host);
  const issues: AnatomyDependencyIssue[] = [];
  const cache = ts.createModuleResolutionCache("/", (p) => p, options);
  for (const path of selected) {
    const source = program.getSourceFile(`/${path}`);
    if (!source) throw new AnatomySourceAnalysisError(path, `Unable to parse ${path}`);
    const diagnostics = program.getSyntacticDiagnostics(source);
    if (diagnostics.length) throw new AnatomySourceAnalysisError(path, `${path}: ${ts.flattenDiagnosticMessageText(diagnostics[0]!.messageText, "\n")}`);
    const rules = config.rules.map((rule, index) => ({ rule, index })).filter(({ rule }) => matchesDependencyPath(path.slice(prefix.length), rule.from));
    const edge = (node: import("typescript").Node, specifier: string): void => {
      const location = source.getLineAndCharacterOfPosition(node.getStart(source));
      const position = `${path}:${location.line + 1}:${location.character + 1}`;
      const alias = Object.keys(paths).some((key) => {
        const star = key.indexOf("*");
        return star < 0 ? key === specifier : specifier.startsWith(key.slice(0, star)) && specifier.endsWith(key.slice(star + 1)) && specifier.length >= key.length - 1;
      });
      const relative = posix.normalize(posix.join(posix.dirname(path), specifier));
      if ((specifier.startsWith(".") && (relative === ".." || relative.startsWith("../"))) ||
          (alias && specifier.split("/").includes("..")) || /[\\]/.test(specifier) || /^[A-Za-z]:/.test(specifier) || specifier.startsWith("file:"))
        throw new AnatomySourceAnalysisError(path, `${position}: Dependency path escapes or is unsupported by the virtual scan: ${specifier}`);
      if (!specifier.startsWith(".") && !specifier.startsWith("/") && !alias) return;
      if (specifier.startsWith("/")) throw new AnatomySourceAnalysisError(path, `${position}: Absolute dependency is outside the virtual scan: ${specifier}`);
      const resolved = ts.resolveModuleName(specifier, `/${path}`, options, host, cache).resolvedModule;
      if (!resolved || !inventory.has(resolved.resolvedFileName)) throw new AnatomySourceAnalysisError(path, `${position}: Cannot resolve local dependency ${specifier} within the supplied inventory`);
      const target = resolved.resolvedFileName.slice(1);
      const relativeTarget = posix.relative(scope === "." ? "" : scope, target);
      for (const { rule, index } of rules) if (matchesDependencyPath(relativeTarget, rule.to)) issues.push({
        code: "dependency_forbidden", severity: rule.policy, path,
        message: `${position}: ${rule.name} forbids ${specifier} -> ${target}`,
        ruleIndex: index, ruleName: rule.name, specifier, targetPath: target,
        line: location.line + 1, column: location.character + 1,
      });
    };
    const literal = (node: import("typescript").Node | undefined): node is import("typescript").StringLiteralLike => !!node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));
    const visit = (node: import("typescript").Node): void => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        if (!literal(node.moduleSpecifier)) throw new AnatomySourceAnalysisError(path, `${path}: Unsupported module specifier`);
        edge(node.moduleSpecifier, node.moduleSpecifier.text);
      } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
        const expression = node.moduleReference.expression;
        if (!literal(expression)) throw new AnatomySourceAnalysisError(path, `${path}: Unsupported import-equals`);
        edge(expression, expression.text);
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && literal(node.argument.literal)) edge(node.argument.literal, node.argument.literal.text);
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        const location = source.getLineAndCharacterOfPosition(node.getStart(source));
        if (node.expression.kind !== ts.SyntaxKind.ImportKeyword || !literal(node.arguments[0])) throw new AnatomySourceAnalysisError(path, `${path}:${location.line + 1}:${location.character + 1}: Computed imports and CommonJS require calls cannot be verified`);
        edge(node.arguments[0], node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return issues;
})(), (cause) => cause instanceof AnatomySourceAnalysisError ? cause : new AnatomySourceAnalysisError(".", `Dependency analysis failed: ${String(cause)}`));
