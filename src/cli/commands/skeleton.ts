import { Command } from "commander";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import chalk from "chalk";
import { skeleton } from "../../core/skeleton.js";

async function loadAnatomy(anatomyPath: string) {
  const absolutePath = resolve(anatomyPath);
  const fileUrl = pathToFileURL(absolutePath).href;
  const mod = await import(fileUrl);
  return mod.default ?? mod.anatomy ?? Object.values(mod)[0];
}

export function skeletonCommand(): Command {
  const cmd = new Command("skeleton");

  cmd
    .description("Generate a skeleton JSON from an anatomy definition")
    .requiredOption("-a, --anatomy <path>", "Path to anatomy definition file (.ts/.js)")
    .option("-o, --output <path>", "Output file path (default: stdout)")
    .action(async (options: { anatomy: string; output?: string }) => {
      const anatomy = await loadAnatomy(options.anatomy);
      const result = skeleton(anatomy);

      const json = JSON.stringify(result, null, 2);

      if (options.output) {
        const { writeFile } = await import("node:fs/promises");
        const outputPath = resolve(options.output);
        await writeFile(outputPath, json + "\n", "utf-8");
        console.log(chalk.green(`✓ Skeleton written to ${outputPath}`));
      } else {
        console.log(json);
      }
    });

  return cmd;
}
