import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseInstallOptions, type InstallOptions } from "./install-options";
import { getPathPlan, quoteShell, windowsPathScript } from "./install-path";
import { runInstallation, windowsLauncher, type InstallContext } from "./install";

const projectRoot = resolve(import.meta.dirname, "../../..");
let temporary: string;
let home: string;
let options: InstallOptions;
let context: InstallContext;

beforeEach(() => {
  mkdirSync(join(projectRoot, "docs"), { recursive: true });
  temporary = mkdtempSync(join(projectRoot, "docs", "installer-test-"));
  home = join(temporary, "home with 'quotes' and $dollars");
  mkdirSync(home);
  const packageRoot = join(temporary, "package");
  mkdirSync(join(packageRoot, "dist"), { recursive: true });
  writeFileSync(join(packageRoot, "dist", "main.js"), 'console.log(process.argv.includes("--help") ? "Usage: anatomy [target] [options]" : JSON.stringify(process.argv.slice(2)));\n');
  options = { prefix: join(home, ".anatomy"), modifyPath: true, uninstall: false, help: false };
  context = {
    home, packageRoot, platform: "linux", nodeVersion: "22.18.0", nodeExecutable: process.execPath,
    env: { ...process.env, SHELL: "/bin/zsh", ZDOTDIR: "", XDG_CONFIG_HOME: "", ANATOMY_INSTALL_DIR: "" },
  };
});

afterEach(() => rmSync(temporary, { recursive: true, force: true }));

describe("installer options", () => {
  it("defaults to a dedicated home directory", () => {
    expect(parseInstallOptions([], home, {})._unsafeUnwrap()).toEqual(options);
  });
  it("parses opt-out, custom directory and uninstall", () => {
    expect(parseInstallOptions(["--prefix", options.prefix, "--no-modify-path", "--uninstall"], home, {})._unsafeUnwrap())
      .toMatchObject({ prefix: options.prefix, modifyPath: false, uninstall: true });
  });
  it.each([["--prefix"], ["--prefix", "--uninstall"], ["--prefix", "/"], ["--prefix", "relative"], ["--unknown"]])("rejects invalid arguments %j", (...args) => {
    expect(parseInstallOptions(args, home, {}).isErr()).toBe(true);
  });
  it("rejects installing directly into the home directory", () => {
    expect(parseInstallOptions(["--prefix", home], home, {}).isErr()).toBe(true);
  });
});

describe("one-shot installation", () => {
  it("installs a persistent CLI outside the runner cache and preserves argument boundaries", () => {
    const result = runInstallation(options, context);
    expect(result.isOk()).toBe(true);
    rmSync(context.packageRoot, { recursive: true });
    const output = execFileSync(join(options.prefix, "bin", "anatomy"), ["./src with spaces", "--ignore", "a,b"], { encoding: "utf8" });
    expect(JSON.parse(output)).toEqual(["./src with spaces", "--ignore", "a,b"]);
    expect(readdirSync(options.prefix).some((name) => name.startsWith(".install-"))).toBe(false);
  });
  it("backs up the profile and does not duplicate PATH on reinstall", () => {
    const profile = join(home, ".zshrc");
    writeFileSync(profile, "# my settings\n");
    expect(runInstallation(options, context).isOk()).toBe(true);
    const first = readFileSync(profile, "utf8");
    expect(runInstallation(options, context).isOk()).toBe(true);
    expect(readFileSync(profile, "utf8")).toBe(first);
    expect(readFileSync(`${profile}.anatomy-backup`, "utf8")).toBe("# my settings\n");
    const bin = join(options.prefix, "bin");
    expect(execFileSync("/bin/sh", ["-c", `. ${quoteShell(profile)}; command -v anatomy`], { env: context.env, encoding: "utf8" }).trim()).toBe(join(bin, "anatomy"));
  });
  it("leaves profiles alone when requested", () => {
    const result = runInstallation({ ...options, modifyPath: false }, context)._unsafeUnwrap();
    expect(existsSync(join(home, ".zshrc"))).toBe(false);
    expect(result.join("\n")).toContain("PATH was not changed");
  });
  it("refuses to overwrite unrelated files", () => {
    mkdirSync(options.prefix);
    writeFileSync(join(options.prefix, "notes.txt"), "keep me");
    expect(runInstallation(options, context).isErr()).toBe(true);
    expect(readFileSync(join(options.prefix, "notes.txt"), "utf8")).toBe("keep me");
  });
  it("uninstalls only managed files and supports reinstall afterwards", () => {
    expect(runInstallation(options, context).isOk()).toBe(true);
    writeFileSync(join(options.prefix, "notes.txt"), "keep me");
    expect(runInstallation({ ...options, uninstall: true }, context).isOk()).toBe(true);
    expect(existsSync(join(options.prefix, "bin", "anatomy"))).toBe(false);
    expect(existsSync(join(options.prefix, "anatomy.mjs"))).toBe(false);
    expect(readFileSync(join(options.prefix, "notes.txt"), "utf8")).toBe("keep me");
    expect(runInstallation(options, context).isOk()).toBe(true);
  });
  it("does not replace a working CLI if the new bundle fails verification", () => {
    expect(runInstallation(options, context).isOk()).toBe(true);
    const before = readFileSync(join(options.prefix, "anatomy.mjs"), "utf8");
    writeFileSync(join(context.packageRoot, "dist", "main.js"), "process.exit(1)");
    expect(runInstallation(options, context).isErr()).toBe(true);
    expect(readFileSync(join(options.prefix, "anatomy.mjs"), "utf8")).toBe(before);
    expect(readdirSync(options.prefix).some((name) => name.startsWith(".install-"))).toBe(false);
  });
  it("rejects incomplete packages and unsupported runtimes before installation", () => {
    expect(runInstallation(options, { ...context, nodeVersion: "16.20.0" }).isErr()).toBe(true);
    expect(existsSync(options.prefix)).toBe(false);
    rmSync(join(context.packageRoot, "dist", "main.js"));
    expect(runInstallation(options, context).isErr()).toBe(true);
    expect(existsSync(options.prefix)).toBe(false);
  });
  it("reports PATH configuration failures without falsely reporting a failed CLI copy", () => {
    const result = runInstallation(options, { ...context, env: { ...context.env, SHELL: "/bin/unsupported-shell" } })._unsafeUnwrap();
    expect(result.join("\n")).toContain("PATH setup needs attention");
    expect(existsSync(join(options.prefix, "bin", "anatomy"))).toBe(true);
  });
});

describe("cross-platform PATH plans", () => {
  it("honors ZDOTDIR and fish config locations", () => {
    expect(getPathPlan("/app/bin", home, { SHELL: "/bin/zsh", ZDOTDIR: "/custom/zsh" }).profile).toBe("/custom/zsh/.zshrc");
    expect(getPathPlan("/app/bin", home, { SHELL: "/bin/fish", XDG_CONFIG_HOME: "/custom/config" })).toEqual({
      profile: "/custom/config/fish/config.fish", line: "fish_add_path --prepend '/app/bin'",
    });
  });
  it("uses a relative Windows launcher and data-only environment input for user PATH", () => {
    expect(windowsLauncher).toContain('node "%~dp0..\\anatomy.mjs" %*');
    expect(windowsPathScript).toContain('$env:ANATOMY_INSTALL_BIN');
    expect(windowsPathScript).toContain('"User"');
    expect(windowsPathScript).not.toContain('"Machine"');
  });
});
