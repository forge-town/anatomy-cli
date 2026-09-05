#!/usr/bin/env node

import { runEntrypoint } from "./run.js";

const args = process.argv.slice(2);
const installFlags = ["--install", "--prefix", "--no-modify-path", "--uninstall"];
const installer = args.length === 0
  || (args.length === 1 && ["--help", "-h"].includes(args[0]))
  || args.some((arg) => installFlags.includes(arg));

await runEntrypoint(installer ? "install-main" : "main");
