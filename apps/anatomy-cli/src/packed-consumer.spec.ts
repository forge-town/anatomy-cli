import { closeSync, existsSync, openSync, readFileSync } from "node:fs";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as pause } from "node:timers/promises";
import { createServer, type Server } from "node:http";
import { ResultAsync } from "neverthrow";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AnatomySkillFiles } from "./AnatomySkillFiles.js";

const root = resolve(import.meta.dirname, "../../..");
const execute = (command: string, args: string[], cwd: string) =>
  ResultAsync.fromPromise(
    promisify(execFile)(command, args, { cwd, maxBuffer: 8 * 1024 * 1024 }),
    (cause) => cause,
  );
let consumer: string;
let bundlePath: string;
let targetPath: string;
let cliPath: string;
const watchChildren: ChildProcess[] = [];
const modelServers: Server[] = [];
afterEach(async () => {
  for (const child of watchChildren.splice(0)) if (child.exitCode === null) child.kill("SIGKILL");
  for (const server of modelServers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
});

beforeAll(async () => {
  await mkdir(join(root, "docs/verification/cod-420"), { recursive: true });
  consumer = await mkdtemp(join(root, "docs/verification/cod-420/consumer-"));
  (await execute("bun", ["run", "build"], root))._unsafeUnwrap();
  const tarballs: string[] = [];
  for (const pkg of ["apps/anatomy-cli"]) {
    const packed = (
      await execute(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", consumer],
        join(root, pkg),
      )
    )._unsafeUnwrap();
    tarballs.push(join(consumer, JSON.parse(packed.stdout)[0].filename));
  }
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({
      name: "anatomy-isolated-consumer",
      private: true,
      type: "module",
    }),
  );
  (
    await execute(
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs],
      consumer,
    )
  )._unsafeUnwrap();
  bundlePath = join(consumer, "bundle.json");
  await writeFile(
    bundlePath,
    await readFile(
      join(root, "apps/anatomy-cli/anatomies/db-schema.bundle.json"),
    ),
  );
  targetPath = join(consumer, "db-schema");
  for (const path of [
    "package.json",
    "tsconfig.json",
    "src/index.ts",
    "src/tables/index.ts",
    "src/tables/accounts/index.ts",
    "src/tables/accounts/accounts.table.ts",
    "src/relations/index.ts",
  ]) {
    const file = join(targetPath, path);
    await mkdir(resolve(file, ".."), { recursive: true });
    await writeFile(file, "");
  }
  cliPath = join(consumer, "node_modules/anatomy-cli/bin/anatomy.js");
  await writeFile(
    join(consumer, "sdk.mjs"),
    `import {scanAnatomy} from 'anatomy-cli';
import {AnatomyScanOutcomeSchema} from 'anatomy-cli';
import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
for(const name of ['anatomy-cli','typescript']) {
  if(!require.resolve(name).startsWith(process.cwd()+'/node_modules/')) throw Error('dependency escaped consumer: '+name);
}
if(Number(process.versions.node.split('.')[0]) < 24) throw Error('Node 24+ required');
if(Object.keys(require.cache).some(p=>p.includes('/typescript/'))) throw Error('eager TypeScript load');
const file=name=>({kind:'file',name}); const dir=(name,children)=>({kind:'directory',name,children});
const target=dir('db-schema',[file('package.json'),file('tsconfig.json'),dir('src',[file('index.ts'),dir('tables',[file('index.ts'),dir('accounts',[file('index.ts'),file('accounts.table.ts')])]),dir('relations',[file('index.ts')])])]);
if(process.argv.includes('--violation')) target.children.push(file('extra.ts'));
const bundle=JSON.parse(readFileSync('bundle.json','utf8'));
let sources;
if(process.argv.includes('--source')) {
  bundle.root='table-domain';
  bundle.definitions.find(item=>item.key===bundle.root).definition.structure.root.children=[{kind:'file',name:{type:'literal',value:'getUser.ts'},quantity:'exactly_one',exports:{name:'file_stem',policy:'block'}}];
  target.name='accounts'; target.children=[file('getUser.ts')];
  sources={'getUser.ts':'export function getUser() { return 1; }'};
}
const result=await scanAnatomy({bundle,target,sources,coverage:{status:'complete'}});
AnatomyScanOutcomeSchema.parse(result);console.log(JSON.stringify(result));`,
  );
}, 120_000);

describe("isolated packed Node consumer", () => {
  it("installs bundled agent skills and exports the schema without model configuration", async () => {
    const destination = join(consumer, "custom agent skills");
    const args = [cliPath, "skills", "install", "--path", destination];
    const installed = (await execute(process.execPath, args, consumer))._unsafeUnwrap();
    expect(installed.stdout).toContain("Installed generate-anatomy");
    for (const file of AnatomySkillFiles) {
      expect(await readFile(join(destination, "generate-anatomy", file), "utf8"))
        .toBe(await readFile(join(root, "apps/anatomy-cli/skills/generate-anatomy", file), "utf8"));
    }
    expect((await execute(process.execPath, args, consumer))._unsafeUnwrap().stdout).toContain("Already installed:");
    const schema = (await execute(process.execPath, [cliPath, "skills", "schema"], consumer))._unsafeUnwrap();
    expect(JSON.parse(schema.stdout).properties.structure.properties.rootMode).toMatchObject({ const: "contents" });
    const help = (await execute(process.execPath, [cliPath, "skills", "--help"], consumer))._unsafeUnwrap();
    expect(help.stdout).toContain("codex,claude-code,pi");
    const abbreviated = await execute(process.execPath, [cliPath, "skills", "install", "--agent", "cc", "--dry-run"], consumer);
    expect(abbreviated.isErr()).toBe(true);
  });

  it("configures a model, generates via HTTP and refuses to overwrite a saved definition", async () => {
    let calls = 0;
    const server = createServer((request, response) => {
      let raw = "";
      request.on("data", (data) => { raw += data.toString(); });
      request.on("end", () => {
        calls++;
        const body = JSON.parse(raw);
        expect(body.model).toBe("fixture-model");
        expect(request.headers.authorization).toBe("Bearer fixture-key");
        expect(body.messages[0].content).toContain("JSON Schema");
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
          name: "Services", purpose: "Model-inferred service conventions", structure: {
            rootMode: "contents", defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
            bindings: { Name: { format: "PascalCase" } },
            root: { children: [{ kind: "file", name: { type: "placeholder", value: "<Name>Service.ts" }, quantity: "one_or_more" }] },
          },
        }) } }] }));
      });
    });
    modelServers.push(server);
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (!address || typeof address === "string") throw Error("Missing model fixture address");
    const config = join(consumer, "model.json");
    const target = join(consumer, "generate-project");
    await mkdir(target);
    await writeFile(join(target, "UserService.ts"), "// Source content is not sent\n");
    await writeFile(join(target, "OrderService.ts"), "");
    const setup = await execute(process.execPath, [cliPath, "config", "model", "--base-url", `http://127.0.0.1:${address.port}/v1`, "--model", "fixture-model", "--api-key-env", "ANATOMY_FIXTURE_MODEL_KEY", "--model-config", config], consumer);
    expect(setup.isOk()).toBe(true);
    expect(JSON.parse(await readFile(config, "utf8")).model).toBe("fixture-model");
    const args = [cliPath, target, "--generate", "--model-config", config, "--instructions", "Infer reusable service names"];
    const env = { ...process.env, ANATOMY_FIXTURE_MODEL_KEY: "fixture-key" };
    const preview = await promisify(execFile)(process.execPath, args, { cwd: consumer, env });
    expect(JSON.parse(preview.stdout).structure.root.children).toHaveLength(1);
    const output = join(target, "anatomy.json");
    await promisify(execFile)(process.execPath, [...args, "--output", output], { cwd: consumer, env });
    const saved = await readFile(output, "utf8");
    expect(calls).toBe(2);
    const overwrite = await ResultAsync.fromPromise(promisify(execFile)(process.execPath, [...args, "--output", output], { cwd: consumer, env }), (cause) => cause);
    expect(overwrite.isErr()).toBe(true);
    expect(await readFile(output, "utf8")).toBe(saved);
    expect(calls).toBe(2);
    expect((await execute(process.execPath, [cliPath, target], consumer)).isOk()).toBe(true);
  }, 30_000);

  it("watches complete bundle checks and exits with the last blocked result", async () => {
    const target = join(consumer, "bundle-watch", "db-schema");
    await cp(targetPath, target, { recursive: true });
    const child = spawn(process.execPath, [cliPath, target, "--bundle", bundlePath, "--watch"], {
      cwd: consumer, stdio: ["ignore", "pipe", "pipe"],
    });
    watchChildren.push(child);
    let output = "";
    child.stdout!.on("data", (data) => { output += data.toString(); });
    child.stderr!.resume();
    const exited = new Promise<number | null>((done) => child.once("exit", (code) => done(code)));
    await vi.waitFor(() => expect(output).toContain("Anatomy structure conforms"), { timeout: 10_000 });
    await writeFile(join(target, "unexpected.ts"), "export {};");
    await vi.waitFor(() => expect(output).toContain("Anatomy structure does not conform"), { timeout: 10_000 });
    child.kill("SIGTERM");
    expect(await exited).toBe(1);
  }, 20_000);

  it("watches source and external config edits, recovers, and avoids redirected-output loops", async () => {
    const target = join(consumer, "watch-project");
    await mkdir(target);
    const definitionPath = join(consumer, "watch-definition.json");
    const definition = {
      name: "Watch project", purpose: "Exercise packaged watch checks",
      structure: {
        rootMode: "contents",
        defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
        root: { children: [
          { kind: "file", name: { type: "literal", value: "required.ts" }, quantity: "exactly_one", exports: { name: "file_stem", policy: "block" } },
          { kind: "file", name: { type: "literal", value: "watch.jsonl" }, quantity: "exactly_one" },
        ] },
      },
    };
    const valid = "export function required() {}";
    await writeFile(join(target, "required.ts"), valid);
    await writeFile(definitionPath, JSON.stringify(definition));
    const report = join(target, "watch.jsonl");
    const fd = openSync(report, "w");
    const child = spawn(process.execPath, [cliPath, target, "--watch", "--definition", definitionPath, "--format", "json"], {
      cwd: consumer, stdio: ["ignore", fd, "pipe"],
    });
    closeSync(fd);
    watchChildren.push(child);
    const exited = new Promise<{ code: number | null; signal: string | null }>((done) => {
      child.once("exit", (code, signal) => done({ code, signal }));
    });
    let errors = "";
    child.stderr!.on("data", (data) => { errors += data.toString(); });
    const reports = () => readFileSync(report, "utf8").split("\n").slice(0, -1).map((line) => JSON.parse(line));
    await vi.waitFor(() => expect(reports()).toHaveLength(1), { timeout: 10_000 });
    expect(reports()[0].conforms).toBe(true);
    await pause(1_500);
    expect(reports()).toHaveLength(1);
    await writeFile(join(target, "required.ts"), "export function wrong() {}");
    await vi.waitFor(() => expect(reports()).toHaveLength(2), { timeout: 10_000 });
    expect(reports()[1].conforms).toBe(false);
    await writeFile(join(target, "required.ts"), valid);
    await vi.waitFor(() => expect(reports()).toHaveLength(3), { timeout: 10_000 });
    expect(reports()[2].conforms).toBe(true);
    await writeFile(definitionPath, "{");
    await vi.waitFor(() => expect(errors.trim()).not.toBe(""), { timeout: 10_000 });
    expect(JSON.parse(errors.trim()).operation).toBe("error");
    expect(child.exitCode).toBeNull();
    await writeFile(definitionPath, JSON.stringify(definition));
    await vi.waitFor(() => expect(reports()).toHaveLength(4), { timeout: 10_000 });
    expect(reports()[3].conforms).toBe(true);
    child.kill("SIGINT");
    expect(await exited).toEqual({ code: 0, signal: null });
  }, 30_000);

  it("prints the packed package version through both npm launchers", async () => {
    const installed = join(consumer, "node_modules/anatomy-cli");
    const manifest = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
    for (const bin of ["anatomy.js", "anatomy-cli.js"]) {
      for (const flag of ["--version", "-v"]) {
        const result = (await execute(process.execPath, [join(installed, "bin", bin), flag], consumer))._unsafeUnwrap();
        expect(result.stdout).toBe(`${manifest.version}\n`);
        expect(result.stderr).toBe("");
      }
    }
  });

  it("retains a staged canary version after the installer source is removed", async () => {
    const installed = join(consumer, "node_modules/anatomy-cli");
    const source = join(consumer, "temporary-release");
    const prefix = join(consumer, "persistent-install");
    await mkdir(join(source, "dist"), { recursive: true });
    const manifest = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
    const version = `${manifest.version}-canary.123.1`;
    await writeFile(join(source, "package.json"), JSON.stringify({ ...manifest, version }));
    for (const file of ["main.js", "install-main.js"]) {
      await copyFile(join(installed, "dist", file), join(source, "dist", file));
    }
    await cp(join(installed, "skills"), join(source, "skills"), { recursive: true });
    expect((await execute(process.execPath, [join(source, "dist/main.js"), "--version"], consumer))._unsafeUnwrap().stdout).toBe(`${version}\n`);
    (await execute(process.execPath, [join(source, "dist/install-main.js"), "--prefix", prefix, "--no-modify-path"], consumer))._unsafeUnwrap();
    await rm(source, { recursive: true });
    for (const flag of ["--version", "-v"]) {
      expect((await execute(process.execPath, [join(prefix, "anatomy.mjs"), flag], consumer))._unsafeUnwrap().stdout).toBe(`${version}\n`);
    }
    const skills = join(consumer, "detached skills");
    (await execute(process.execPath, [join(prefix, "anatomy.mjs"), "skills", "install", "--path", skills], consumer))._unsafeUnwrap();
    for (const file of AnatomySkillFiles) {
      expect(await readFile(join(skills, "generate-anatomy", file), "utf8"))
        .toBe(await readFile(join(installed, "skills/generate-anatomy", file), "utf8"));
    }
  });

  /** @summary Install packages in an ordinary Node consumer
   * @description
   * Given: An isolated consumer installs only the anatomy-cli tarball and runs exclusively through Node.
   * When: The maintainer installs and runs the packed consumer example.
   * Then: ESM imports, type resolution, and CLI bins work without unresolved workspace dependencies.
   */
  it("[AC-28] resolves JavaScript, declarations and manifests", async () => {
    for (const pkg of ["anatomy-cli"]) {
      const manifest = await readFile(
        join(consumer, "node_modules", pkg, "package.json"),
        "utf8",
      );
      expect(manifest).not.toContain("workspace:");
      expect(JSON.parse(manifest).engines.node).toBe(">=24");
    }
    await writeFile(
      join(consumer, "typecheck.ts"),
      `import {scanAnatomy,queryAnatomyBundle,validateAnatomyBundle} from 'anatomy-cli';
import type {AnatomyScanOutcome,AnatomyBundleQueryOutcome} from 'anatomy-cli';
const scan: Promise<AnatomyScanOutcome> = scanAnatomy({});
const query: AnatomyBundleQueryOutcome = queryAnatomyBundle({});
validateAnatomyBundle({}); void scan; void query;`,
    );
    for (const obsolete of [
      "AnatomyVersionSchema",
      "AnatomyPublishedVersionListInputSchema",
    ]) {
      expect(
        existsSync(
          join(
            consumer,
            "node_modules/anatomy-cli/dist/packages/schemas/src/anatomy",
            `${obsolete}.js`,
          ),
        ),
      ).toBe(false);
    }
    expect(
      existsSync(
        join(
          consumer,
          "node_modules/anatomy-cli/dist/packages/schemas/src/composition/AnatomyNodeV2Schema.js",
        ),
      ),
    ).toBe(false);
    const tsc = join(consumer, "node_modules/typescript/bin/tsc");
    expect(
      (
        await execute(
          process.execPath,
          [
            tsc,
            "--noEmit",
            "--strict",
            "--typeRoots",
            "node_modules/@types",
            "--target",
            "ES2022",
            "--module",
            "NodeNext",
            "--moduleResolution",
            "NodeNext",
            "typecheck.ts",
          ],
          consumer,
        )
      ).isOk(),
    ).toBe(true);
    const cli = await execute(process.execPath, [cliPath, "--help"], consumer);
    expect(cli._unsafeUnwrap().stdout).toContain("--bundle");
  }, 30_000);
  it("ships the engine and schemas without private npm package dependencies", async () => {
    expect(existsSync(join(consumer, "node_modules/@anatomy-cli"))).toBe(false);
    const installed = join(consumer, "node_modules/anatomy-cli");
    const manifest = JSON.parse(
      await readFile(join(installed, "package.json"), "utf8"),
    );
    for (const section of [
      "dependencies",
      "peerDependencies",
      "optionalDependencies",
    ])
      expect(
        Object.keys(manifest[section] ?? {}).filter((name) =>
          name.startsWith("@anatomy-cli/"),
        ),
      ).toEqual([]);
    for (const file of await readdir(join(installed, "dist"), {
      recursive: true,
    })) {
      if (!file.endsWith(".d.ts")) continue;
      expect(
        await readFile(join(installed, "dist", file), "utf8"),
      ).not.toContain("@anatomy-cli/");
    }
    for (const name of ["anatomy", "schemas"])
      expect(
        JSON.parse(
          await readFile(join(root, "packages", name, "package.json"), "utf8"),
        ).private,
      ).toBe(true);
  });
  /** @summary Scan five definitions from supplied data alone
   * @description
   * Given: A product-side fixture maps five authorized definitions to logical keys and supplies the complete target tree.
   * When: The integrator runs the packed SDK consumer example.
   * Then: The result has actual mount provenance without temporary directories, network reads, or a second scanner.
   */
  it("[AC-30] imports a lazy data-only SDK in Node", async () => {
    const result = (
      await execute(process.execPath, ["sdk.mjs"], consumer)
    )._unsafeUnwrap();
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "completed",
      conforms: true,
    });
    const source = (
      await execute(process.execPath, ["sdk.mjs", "--source"], consumer)
    )._unsafeUnwrap();
    expect(JSON.parse(source.stdout)).toMatchObject({
      status: "completed",
      conforms: true,
    });
  });
  /** @summary Keep CLI and SDK outcomes equivalent
   * @description
   * Given: CLI and SDK receive identical definitions, target trees, and sources.
   * When: The maintainer runs the two scan entry points for comparison.
   * Then: Finding codes, severities, relative paths, origins, and mount chains agree.
   */
  it("[AC-25] agrees between installed CLI and SDK", async () => {
    const sdk = (
      await execute(process.execPath, ["sdk.mjs"], consumer)
    )._unsafeUnwrap();
    const cli = (
      await execute(
        process.execPath,
        [cliPath, targetPath, "--bundle", bundlePath, "--format", "json"],
        consumer,
      )
    )._unsafeUnwrap();
    expect(JSON.parse(cli.stdout)).toEqual(JSON.parse(sdk.stdout));
    const query = (
      await execute(
        process.execPath,
        [
          cliPath,
          targetPath,
          "--bundle",
          bundlePath,
          "--query",
          "src/tables/accounts",
          "--format",
          "json",
        ],
        consumer,
      )
    )._unsafeUnwrap();
    expect(JSON.parse(query.stdout)).toMatchObject({
      status: "resolved",
      rules: [
        { origin: { definitionKey: "tables-class" } },
        { origin: { definitionKey: "table-domain" } },
      ],
    });
  });
  /** @summary Distinguish pass, block, and execution error in CLI exit codes
   * @description
   * Given: Fixtures respectively conform, contain a block finding, and have an unavailable reference.
   * When: The maintainer runs anatomy --bundle for each fixture.
   * Then: Exit codes are respectively 0, 1, and 2 with consistent JSON completion states.
   */
  it("[AC-26] distinguishes exit codes and preserves unexpected files", async () => {
    await writeFile(join(targetPath, "extra.ts"), "must remain");
    const blocked = await execute(
      process.execPath,
      [cliPath, targetPath, "--bundle", bundlePath, "--format", "json"],
      consumer,
    );
    expect(blocked.isErr()).toBe(true);
    if (blocked.isErr()) {
      const error = blocked.error as { code: number; stdout: string };
      expect(error.code).toBe(1);
      expect(JSON.parse(error.stdout)).toMatchObject({
        status: "completed",
        conforms: false,
        issues: [{ code: "unexpected_entry" }],
      });
    }
    const sdk = (
      await execute(process.execPath, ["sdk.mjs", "--violation"], consumer)
    )._unsafeUnwrap();
    if (blocked.isErr()) {
      expect(JSON.parse((blocked.error as { stdout: string }).stdout)).toEqual(
        JSON.parse(sdk.stdout),
      );
    }
    expect(await readFile(join(targetPath, "extra.ts"), "utf8")).toBe(
      "must remain",
    );
    const bundle = JSON.parse(await readFile(bundlePath, "utf8"));
    bundle.root = "missing";
    const bad = join(consumer, "invalid.json");
    await writeFile(bad, JSON.stringify(bundle));
    const failed = await execute(
      process.execPath,
      [cliPath, targetPath, "--bundle", bad, "--format", "json"],
      consumer,
    );
    expect(failed.isErr()).toBe(true);
    if (failed.isErr()) {
      const error = failed.error as { code: number; stdout: string };
      expect(error.code).toBe(2);
      expect(JSON.parse(error.stdout)).toMatchObject({
        status: "error",
        conforms: null,
      });
    }
  });
});
