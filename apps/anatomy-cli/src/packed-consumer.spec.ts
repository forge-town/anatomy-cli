import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { promisify } from "node:util";
import { ResultAsync } from "neverthrow";
import { beforeAll, describe, expect, it } from "vitest";

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
