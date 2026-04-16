import { Command } from "commander";
import { examineCommand } from "./commands/examine.js";
import { skeletonCommand } from "./commands/skeleton.js";
import { schemaCommand } from "./commands/schema.js";

export function createCli(): Command {
  const program = new Command();

  program
    .name("anatomy")
    .description("Define, examine, and scaffold any structure with Zod schemas")
    .version("0.0.1");

  program.addCommand(examineCommand());
  program.addCommand(skeletonCommand());
  program.addCommand(schemaCommand());

  return program;
}
