import { Command } from "commander";
import chalk from "chalk";
import { examine } from "../../core/examine.js";
import { loadAnatomy, loadSpec } from "../loader.js";

export function examineCommand(): Command {
  const cmd = new Command("examine");

  cmd
    .description("Validate a JSON spec against an anatomy definition (.ts/.js or .json)")
    .requiredOption("-a, --anatomy <path>", "Path to anatomy definition file (.ts/.js/.json)")
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
          // Resolve the actual value at the error path from the spec
          let actual: unknown = spec;
          for (const segment of error.path) {
            if (actual !== null && typeof actual === "object") {
              actual = (actual as Record<string | number, unknown>)[segment];
            } else {
              actual = undefined;
              break;
            }
          }
          const actualStr = actual !== undefined ? ` (got: ${JSON.stringify(actual)})` : "";
          console.log(chalk.red(`  • ${path}${actualStr}: ${error.message}`));
        }
        process.exitCode = 1;
      }
    });

  return cmd;
}
