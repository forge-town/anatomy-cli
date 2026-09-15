import ts from "typescript";
import { err, ok, Result, type Result as ResultType } from "neverthrow";
import { AnatomySourceAnalysisError } from "../core/AnatomySourceAnalysisError.js";
import type { AnatomySourceExports } from "@anatomy-cli/schemas";

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) &&
  ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true;

export const analyzeSourceExports = (
  path: string,
  content: string,
): ResultType<AnatomySourceExports, AnatomySourceAnalysisError> => {
  const fail = (message: string) =>
    err(new AnatomySourceAnalysisError(path, `${path}: ${message}`));
  if (!/\.(?:[cm]?[jt]s|[jt]sx)$/i.test(path) || /\.d\.[cm]?ts$/i.test(path)) {
    return fail(
      "Function export checks require a JavaScript or TypeScript implementation file",
    );
  }
  const parsed = Result.fromThrowable(
    () => {
      const options: ts.CompilerOptions = {
        noLib: true,
        noResolve: true,
        types: [],
        allowJs: true,
        target: ts.ScriptTarget.Latest,
      };
      const host: ts.CompilerHost = {
        getSourceFile: () => undefined,
        fileExists: () => false,
        readFile: () => undefined,
        getDefaultLibFileName: () => "",
        writeFile: () => undefined,
        getCurrentDirectory: () => "/",
        getCanonicalFileName: (name) => name,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => "\n",
        directoryExists: () => false,
        getDirectories: () => [],
        realpath: (name) => name,
      };
      host.getSourceFile = (filename, languageVersion) =>
        filename === path
          ? ts.createSourceFile(filename, content, languageVersion, true)
          : undefined;
      host.fileExists = (filename) => filename === path;
      host.readFile = (filename) => (filename === path ? content : undefined);
      const program = ts.createProgram([path], options, host);
      return {
        file: program.getSourceFile(path),
        diagnostics: program.getSyntacticDiagnostics(),
      };
    },
    (cause) =>
      new AnatomySourceAnalysisError(
        path,
        `Unable to parse ${path}: ${String(cause)}`,
      ),
  )();
  if (parsed.isErr()) return err(parsed.error);
  const { file, diagnostics } = parsed.value;
  if (!file) return fail("Unable to create source file");
  if (diagnostics.length)
    return fail(
      ts.flattenDiagnosticMessageText(diagnostics[0]!.messageText, "\n"),
    );

  const locals = new Map<string, ts.Node[]>();
  const register = (name: string, node: ts.Node) =>
    locals.set(name, [...(locals.get(name) ?? []), node]);
  const bindingNames = (name: ts.BindingName): string[] =>
    ts.isIdentifier(name)
      ? [name.text]
      : name.elements.flatMap((element) =>
          ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
        );
  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        for (const name of bindingNames(declaration.name))
          register(name, declaration);
      }
    } else if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.name) register(clause.name.text, clause);
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings))
          register(clause.namedBindings.name.text, clause);
        else
          for (const specifier of clause.namedBindings.elements)
            register(specifier.name.text, specifier);
      }
    } else if (
      "name" in statement &&
      statement.name &&
      ts.isIdentifier(statement.name as ts.Node)
    ) {
      register((statement.name as ts.Identifier).text, statement);
    }
  }

  const resolveExpression = (
    expression: ts.Expression,
    seen: Set<string>,
  ): "function" | "value" | "unknown" => {
    if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression))
      return "function";
    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isTypeAssertionExpression(expression) ||
      ts.isSatisfiesExpression(expression) ||
      ts.isNonNullExpression(expression)
    ) {
      return resolveExpression(expression.expression, seen);
    }
    if (ts.isIdentifier(expression)) {
      const kind = resolveLocal(expression.text, seen);
      return kind === "type" ? "unknown" : kind;
    }
    if (
      ts.isCallExpression(expression) ||
      ts.isAwaitExpression(expression) ||
      ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression) ||
      ts.isConditionalExpression(expression)
    )
      return "unknown";
    return "value";
  };
  const resolveLocal = (
    name: string,
    seen = new Set<string>(),
  ): "function" | "value" | "type" | "unknown" => {
    if (seen.has(name)) return "unknown";
    const declarations = locals.get(name);
    if (!declarations?.length) return "unknown";
    const next = new Set([...seen, name]);
    const runtime = declarations.filter(
      (node) =>
        !ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node),
    );
    if (!runtime.length) return "type";
    const functions = runtime.filter(ts.isFunctionDeclaration);
    if (functions.length === runtime.length)
      return functions.filter((node) => node.body).length === 1
        ? "function"
        : "unknown";
    if (runtime.length !== 1) return "unknown";
    const node = runtime[0]!;
    if (ts.isImportClause(node)) return node.isTypeOnly ? "type" : "unknown";
    if (ts.isImportSpecifier(node))
      return node.isTypeOnly || node.parent.parent.isTypeOnly
        ? "type"
        : "unknown";
    if (hasModifier(node, ts.SyntaxKind.DeclareKeyword)) return "unknown";
    if (ts.isVariableDeclaration(node)) {
      if (!ts.isIdentifier(node.name) || !node.initializer) return "unknown";
      return resolveExpression(node.initializer, next);
    }
    return "value";
  };

  let commonJs = false;
  const isCommonJsTarget = (node: ts.Node): boolean => {
    if (ts.isIdentifier(node)) return node.text === "exports";
    if (ts.isPropertyAccessExpression(node))
      return (
        isCommonJsTarget(node.expression) ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "module" &&
          node.name.text === "exports")
      );
    if (ts.isElementAccessExpression(node))
      return (
        isCommonJsTarget(node.expression) ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "module" &&
          ts.isStringLiteral(node.argumentExpression) &&
          node.argumentExpression.text === "exports")
      );
    return false;
  };
  const inspect = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      isCommonJsTarget(node.left)
    )
      commonJs = true;
    if (ts.isCallExpression(node) && node.arguments.some(isCommonJsTarget))
      commonJs = true;
    ts.forEachChild(node, inspect);
  };
  inspect(file);
  if (commonJs)
    return fail(
      "CommonJS export mutations are not supported; use local ES module exports",
    );

  const exported: AnatomySourceExports = [];
  const exportedFunctions = new Set<string>();
  const addLocal = (
    local: string,
    name: string,
  ): ResultType<void, AnatomySourceAnalysisError> => {
    const kind = resolveLocal(local);
    if (kind === "unknown")
      return fail(
        `Cannot determine whether export "${name}" is a local function; imported, ambient and computed exports are not supported`,
      );
    if (kind !== "type") exported.push({ name, kind });
    return ok(undefined);
  };

  for (const statement of file.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      if (statement.moduleSpecifier) {
        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause) &&
          statement.exportClause.elements.every((item) => item.isTypeOnly)
        )
          continue;
        return fail(
          "Runtime re-exports are not supported; export a local function",
        );
      }
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause))
        return fail("Unsupported export declaration");
      for (const item of statement.exportClause.elements) {
        if (item.isTypeOnly) continue;
        const added = addLocal(
          (item.propertyName ?? item.name).text,
          item.name.text,
        );
        if (added.isErr()) return err(added.error);
      }
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      if (statement.isExportEquals)
        return fail("CommonJS export assignments are not supported");
      const kind = resolveExpression(statement.expression, new Set());
      if (kind === "unknown")
        return fail("Cannot resolve computed default export");
      exported.push({ name: "default", kind });
      continue;
    }
    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    )
      continue;
    if (hasModifier(statement, ts.SyntaxKind.DeclareKeyword))
      return fail(
        "Ambient runtime exports cannot be verified in an implementation file",
      );
    const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
    if (ts.isFunctionDeclaration(statement)) {
      if (!statement.name) {
        exported.push({ name: "default", kind: "function" });
        continue;
      }
      if (exportedFunctions.has(statement.name.text)) continue;
      exportedFunctions.add(statement.name.text);
      const added = addLocal(
        statement.name.text,
        isDefault ? "default" : statement.name.text,
      );
      if (added.isErr()) return err(added.error);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        for (const name of bindingNames(declaration.name)) {
          const added = addLocal(name, name);
          if (added.isErr()) return err(added.error);
        }
      }
    } else if (
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isModuleDeclaration(statement)
    ) {
      exported.push({
        name: isDefault ? "default" : (statement.name?.text ?? "default"),
        kind: "value",
      });
    } else return fail("Unsupported runtime export declaration");
  }
  return ok(exported);
};
