import { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { loadAnatomy } from "../loader.js";

export function schemaCommand(): Command {
  const cmd = new Command("schema");

  cmd
    .description("Export anatomy definition as JSON Schema")
    .requiredOption("-a, --anatomy <path>", "Path to anatomy definition file (.ts/.js/.json)")
    .option("-o, --output <path>", "Output file path (default: stdout)")
    .action(async (options: { anatomy: string; output?: string }) => {
      const anatomy = await loadAnatomy(options.anatomy);
      const jsonSchema = anatomy.toJSONSchema();
      const json = JSON.stringify(jsonSchema, null, 2);

      if (options.output) {
        const { writeFile } = await import("node:fs/promises");
        const outputPath = resolve(options.output);
        await writeFile(outputPath, json + "\n", "utf-8");
        console.log(chalk.green(`✓ JSON Schema written to ${outputPath}`));
      } else {
        console.log(json);
      }
    });

  return cmd;
}
