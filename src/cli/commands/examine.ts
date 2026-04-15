import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import chalk from "chalk";
import { examine } from "../../core/examine.js";

async function loadAnatomy(anatomyPath: string) {
  const absolutePath = resolve(anatomyPath);
  const fileUrl = pathToFileURL(absolutePath).href;
  const mod = await import(fileUrl);
  return mod.default ?? mod.anatomy ?? Object.values(mod)[0];
}

async function loadSpec(specPath: string): Promise<unknown> {
  const absolutePath = resolve(specPath);
  const content = await readFile(absolutePath, "utf-8");
  return JSON.parse(content);
}

export function examineCommand(): Command {
  const cmd = new Command("examine");

  cmd
    .description("Validate a JSON spec against an anatomy definition")
    .requiredOption("-a, --anatomy <path>", "Path to anatomy definition file (.ts/.js)")
    .requiredOption("-s, --spec <path>", "Path to JSON spec file")
    .action(async (options: { anatomy: string; spec: string }) => {
      const anatomy = await loadAnatomy(options.anatomy);
      const spec = await loadSpec(options.spec);
      const result = examine(anatomy, spec);

      if (result.success) {
        console.log(chalk.green(`✓ Spec is valid for anatomy "${result.anatomyName}"`));
        process.exitCode = 0;
      } else {
        console.log(chalk.red(`✗ Spec is invalid for anatomy "${result.anatomyName}"`));
        console.log();
        for (const error of result.errors) {
          const path = error.path.length > 0 ? error.path.join(".") : "(root)";
          console.log(chalk.red(`  • ${path}: ${error.message}`));
        }
        process.exitCode = 1;
      }
    });

  return cmd;
}
