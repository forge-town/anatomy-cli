import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { ResultAsync } from "neverthrow";
import { NpmReleaseError } from "./NpmReleaseError.js";
import { planNpmRelease, type NpmPackageHistory } from "./planNpmRelease.js";

export const runNpmRelease = (mode: string) =>
  ResultAsync.fromPromise(
    (async () => {
      const root = resolve(import.meta.dirname, "../../..");
      const output = join(root, "docs/verification/npm-release/artifacts");
      const packagePaths = ["apps/anatomy-cli"];
      const names = ["anatomy-cli"];
      const exec = async (command: string, args: string[], cwd = root) =>
        (
          await promisify(execFile)(command, args, {
            cwd,
            maxBuffer: 16 * 1024 * 1024,
          })
        ).stdout.trim();
      const source = await exec("git", ["rev-parse", "HEAD"]);
      const manifest = async (path: string) =>
        JSON.parse(await readFile(join(root, path, "package.json"), "utf8"));
      const readHistory = async (name: string): Promise<NpmPackageHistory> => {
        const response = await fetch(
          `https://registry.npmjs.org/${encodeURIComponent(name)}`,
          {
            signal: AbortSignal.timeout(30_000),
            headers: { accept: "application/json" },
          },
        );
        if (response.status === 404) return { name, versions: {}, tags: {} };
        if (!response.ok)
          throw new NpmReleaseError(
            `${name}: registry returned ${response.status}`,
          );
        const data = (await response.json()) as {
          versions?: NpmPackageHistory["versions"];
          "dist-tags"?: Record<string, string>;
        };
        if (!data.versions || !data["dist-tags"])
          throw new NpmReleaseError(`${name}: malformed registry metadata`);
        return { name, versions: data.versions, tags: data["dist-tags"] };
      };
      const checkConsumer = async (
        specifiers: string[],
        label: string,
        version: string,
      ) => {
        const consumer = join(output, label);
        await rm(consumer, { recursive: true, force: true });
        await mkdir(consumer, { recursive: true });
        await writeFile(
          join(consumer, "package.json"),
          JSON.stringify({
            name: "anatomy-release-check",
            private: true,
            type: "module",
          }),
        );
        await exec(
          "npm",
          [
            "install",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            ...specifiers,
          ],
          consumer,
        );
        await writeFile(
          join(consumer, "check.mjs"),
          `import { scanAnatomy, queryAnatomyBundle } from 'anatomy-cli';
import { AnatomyScanOutcomeSchema } from 'anatomy-cli';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
for(const name of ${JSON.stringify(names)}) {
  const entry=require.resolve(name);
  if(!entry.startsWith(process.cwd()+'/node_modules/')) throw Error('Dependency escaped consumer');
  const pkg=JSON.parse(readFileSync('node_modules/'+name+'/package.json','utf8'));
  if(pkg.version!==${JSON.stringify(version)}) throw Error('Wrong installed version: '+name);
}
const bundle=${await readFile(join(root, "apps/anatomy-cli/anatomies/db-schema.bundle.json"), "utf8")};
const f=name=>({kind:'file',name});const d=(name,children)=>({kind:'directory',name,children});
const target=d('db-schema',[f('package.json'),f('tsconfig.json'),d('src',[f('index.ts'),d('tables',[f('index.ts'),d('accounts',[f('index.ts'),f('users.table.ts')])]),d('relations',[f('index.ts')])])]);
const result=await scanAnatomy({bundle,target,coverage:{status:'complete'}});
AnatomyScanOutcomeSchema.parse(result);
if(!result.conforms) throw Error(JSON.stringify(result));
const q=queryAnatomyBundle({bundle,path:'src/tables/accounts'});
if(q.status!=='resolved'||q.rules.length!==2)throw Error('Mount query failed');
console.log(JSON.stringify({node:process.version,version:${JSON.stringify(version)},conforms:result.conforms,query:q.status}));`,
        );
        const checked = await exec("node", ["check.mjs"], consumer);
        const help = await exec(
          "node",
          ["node_modules/anatomy-cli/bin/anatomy.js", "--help"],
          consumer,
        );
        if (!help.includes("--bundle"))
          throw new NpmReleaseError("Installed CLI does not expose --bundle");
        await writeFile(
          join(consumer, "check.ts"),
          "import {scanAnatomy} from 'anatomy-cli';\nimport type {AnatomyScanOutcome} from 'anatomy-cli';\nconst result: Promise<AnatomyScanOutcome> = scanAnatomy({});\nvoid result;\n",
        );
        await exec(
          "node",
          [
            "node_modules/typescript/bin/tsc",
            "--noEmit",
            "--strict",
            "--skipLibCheck",
            "--target",
            "ES2022",
            "--module",
            "NodeNext",
            "--moduleResolution",
            "NodeNext",
            "check.ts",
          ],
          consumer,
        );
        await writeFile(join(output, `${label}.json`), checked + "\n");
      };
      if (mode === "prepare") {
        await mkdir(output, { recursive: true });
        const channel = process.env.RELEASE_CHANNEL ?? "stable";
        const plan = planNpmRelease(
          await Promise.all(names.map(readHistory)),
          source,
          channel,
          process.env.GITHUB_RUN_ID ?? "0",
          process.env.GITHUB_RUN_ATTEMPT ?? "1",
        );
        if (plan.isErr()) throw plan.error;
        const packages = [];
        for (const path of packagePaths) {
          const pkg = await manifest(path);
          pkg.version = plan.value.version;
          pkg.gitHead = source;
          pkg.repository = {
            type: "git",
            url: "git+https://github.com/forge-town/anatomy-cli.git",
            directory: path,
          };
          if (pkg.private || pkg.name !== "anatomy-cli")
            throw new NpmReleaseError(
              "Only the public anatomy-cli package may be published",
            );
          for (const key of [
            "dependencies",
            "peerDependencies",
            "optionalDependencies",
          ])
            if (
              Object.keys(pkg[key] ?? {}).some((name) =>
                name.startsWith("@anatomy-cli/"),
              )
            )
              throw new NpmReleaseError(
                "Public package cannot depend on private workspaces",
              );
          delete pkg.devDependencies;
          const staging = join(
            output,
            "packages",
            pkg.name.replaceAll("/", "-"),
          );
          await rm(staging, { recursive: true, force: true });
          await mkdir(staging, { recursive: true });
          for (const item of pkg.files)
            await cp(join(root, path, item), join(staging, item), {
              recursive: true,
            });
          await writeFile(
            join(staging, "package.json"),
            JSON.stringify(pkg, null, 2) + "\n",
          );
          const packed = JSON.parse(
            await exec(
              "npm",
              [
                "pack",
                "--ignore-scripts",
                "--json",
                "--pack-destination",
                output,
              ],
              staging,
            ),
          )[0];
          const tarball = join(output, packed.filename);
          const integrity =
            "sha512-" +
            createHash("sha512")
              .update(await readFile(tarball))
              .digest("base64");
          packages.push({
            name: pkg.name as string,
            filename: packed.filename as string,
            integrity,
          });
        }
        const document = { ...plan.value, packages };
        await writeFile(
          join(output, "release-plan.json"),
          JSON.stringify(document, null, 2) + "\n",
        );
        await checkConsumer(
          packages.map((p) => join(output, p.filename)),
          "packed-consumer",
          document.version,
        );
        console.log(JSON.stringify(document, null, 2));
        return;
      }
      if (!["publish", "verify"].includes(mode))
        throw new NpmReleaseError("Expected prepare, publish, or verify");
      const plan = JSON.parse(
        await readFile(join(output, "release-plan.json"), "utf8"),
      ) as {
        source: string;
        version: string;
        tag: string;
        channel: string;
        packages: { name: string; filename: string; integrity: string }[];
      };
      if (
        plan.source !== source ||
        plan.packages.map((p) => p.name).join() !== names.join()
      )
        throw new NpmReleaseError(
          "Release plan does not match the checked-out source and packages",
        );
      if (
        (plan.channel === "canary" && plan.tag !== "canary") ||
        (plan.channel === "stable" && plan.tag !== "latest") ||
        !["stable", "canary"].includes(plan.channel)
      )
        throw new NpmReleaseError("Invalid release channel/tag pair");
      if (mode === "publish") {
        if (process.env.GITHUB_ACTIONS !== "true")
          throw new NpmReleaseError("Publication must run in GitHub Actions");
        if (
          plan.channel === "stable" &&
          process.env.GITHUB_REF !== "refs/heads/main"
        )
          throw new NpmReleaseError("Stable publication is restricted to main");
        if (!process.env.NODE_AUTH_TOKEN)
          throw new NpmReleaseError(
            "Configure the NPM_TOKEN repository secret before publication",
          );
        for (const pkg of plan.packages) {
          const tarball = join(output, pkg.filename);
          const integrity =
            "sha512-" +
            createHash("sha512")
              .update(await readFile(tarball))
              .digest("base64");
          if (integrity !== pkg.integrity)
            throw new NpmReleaseError(`Tarball changed: ${pkg.name}`);
          const history = await readHistory(pkg.name);
          const existing = history.versions[plan.version];
          if (existing) {
            if (
              existing.gitHead !== source ||
              existing.dist?.integrity !== integrity
            )
              throw new NpmReleaseError(
                `Refusing conflicting published version: ${pkg.name}@${plan.version}`,
              );
            if (history.tags[plan.tag] !== plan.version)
              await exec("npm", [
                "dist-tag",
                "add",
                `${pkg.name}@${plan.version}`,
                plan.tag,
              ]);
          } else {
            console.log(
              `Publishing ${pkg.name}@${plan.version} with tag ${plan.tag}`,
            );
            await exec("npm", [
              "publish",
              tarball,
              "--ignore-scripts",
              "--access",
              "public",
              "--tag",
              plan.tag,
              "--provenance",
            ]);
          }
        }
      }
      for (const pkg of plan.packages) {
        let confirmed = false;
        for (let attempt = 0; attempt < 6; attempt++) {
          const history = await readHistory(pkg.name);
          const published = history.versions[plan.version];
          confirmed =
            published?.gitHead === source &&
            published.dist?.integrity === pkg.integrity &&
            history.tags[plan.tag] === plan.version;
          if (confirmed) break;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * 2 ** attempt),
          );
        }
        if (!confirmed)
          throw new NpmReleaseError(
            `Registry readback did not confirm ${pkg.name}@${plan.version}`,
          );
      }
      await checkConsumer(
        plan.packages.map((p) => `${p.name}@${plan.version}`),
        "registry-consumer",
        plan.version,
      );
      console.log(`Verified anatomy-cli at ${plan.version} (${plan.tag})`);
    })(),
    (cause) =>
      cause instanceof NpmReleaseError
        ? cause
        : new NpmReleaseError(
            cause instanceof Error ? cause.message : String(cause),
          ),
  );
