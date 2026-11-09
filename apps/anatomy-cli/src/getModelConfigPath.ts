import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const getModelConfigPath = (path?: string, env = process.env) => path
  ? resolve(path)
  : join(env.XDG_CONFIG_HOME || (process.platform === "win32" ? env.APPDATA || join(homedir(), "AppData", "Roaming") : join(homedir(), ".config")), "anatomy", "model.json");
