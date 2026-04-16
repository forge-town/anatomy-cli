import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { defineAnatomyFromSchema } from "../core/anatomy.js";
import type { Anatomy } from "../core/anatomy.js";

export async function loadAnatomy(anatomyPath: string): Promise<Anatomy> {
  const absolutePath = resolve(anatomyPath);
  const ext = extname(absolutePath);

  if (ext === ".json") {
    const content = await readFile(absolutePath, "utf-8");
    const jsonSchema = JSON.parse(content);
    return defineAnatomyFromSchema(jsonSchema);
  }

  const fileUrl = pathToFileURL(absolutePath).href;
  const mod = await import(fileUrl);
  return mod.default ?? mod.anatomy ?? Object.values(mod)[0];
}

export async function loadSpec(specPath: string): Promise<unknown> {
  const absolutePath = resolve(specPath);
  const content = await readFile(absolutePath, "utf-8");
  return JSON.parse(content);
}
