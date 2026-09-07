import { describe, expect, it } from "vitest";
import { analyzeSourceExports } from "./analyze-source-exports";

describe("JavaScript and TypeScript export analysis", () => {
  it.each([
    "export function getUser() {}",
    "export async function getUser() {}",
    "export function* getUser() { yield 1; }",
    "export const getUser = () => ({});",
    "export const getUser = async () => ({});",
    "export const getUser = function internal() {};",
    "const getUser = () => {}; export { getUser };",
    "function implementation() {} export { implementation as getUser };",
    "function implementation() {} const getUser = implementation; export { getUser };",
    "export const getUser = (() => {}) satisfies () => void;",
    "export function getUser(id: string): void; export function getUser(id: number): void; export function getUser(id: string | number) {}",
    "export type User = { id: string }; export interface Options {} export function getUser() {}",
    "type User = {}; interface Options {} export { User, Options }; export const getUser = () => {};",
    "import type { User } from './user'; export { User }; export function getUser() {}",
    "export type * from './types'; export function getUser() {}",
    "export { type User } from './types'; export function getUser() {}",
    "// export function fake() {}\nconst text = 'export const fake = 1'; export function getUser() {}",
    "throw new Error('This source must never execute'); export function getUser() {}",
  ])("finds local functions without executing source: %s", (source) => {
    expect(analyzeSourceExports("/project/getUser.ts", source)._unsafeUnwrap())
      .toEqual([{ name: "getUser", kind: "function" }]);
  });

  it.each(["ts", "tsx", "js", "jsx", "mts", "mjs", "cts", "cjs"])("parses the %s implementation extension", (extension) => {
    expect(analyzeSourceExports(`/project/getUser.${extension}`, "export const getUser = () => {};").isOk()).toBe(true);
  });

  it("parses JSX function bodies", () => {
    expect(analyzeSourceExports("/project/GetUser.tsx", "export const GetUser = () => <div>User</div>;")._unsafeUnwrap())
      .toEqual([{ name: "GetUser", kind: "function" }]);
  });

  it.each([
    ["export default function getUser() {}", "function"],
    ["export default () => {};", "function"],
    ["function getUser() {} export { getUser as default };", "function"],
    ["export default class User {}", "value"],
  ])("preserves default export identity: %s", (source, kind) => {
    expect(analyzeSourceExports("/project/getUser.ts", source)._unsafeUnwrap())
      .toEqual([{ name: "default", kind }]);
  });

  it("counts extra runtime values while ignoring type exports", () => {
    expect(analyzeSourceExports("/project/getUser.ts", "export const version = 1; export class User {} export type Id = string; export function getUser() {}")._unsafeUnwrap())
      .toEqual([{ name: "version", kind: "value" }, { name: "User", kind: "value" }, { name: "getUser", kind: "function" }]);
  });

  it.each([
    "export function getUser( {",
    "export * from './other';",
    "export { getUser } from './other';",
    "import { getUser } from './other'; export { getUser };",
    "export const getUser = createFunction();",
    "export declare function getUser(): void;",
    "const one = two; const two = one; export { one };",
    "export function getUser() {} module.exports = {};",
    "export function getUser() {} exports.extra = 1;",
    "export function getUser() {} Object.assign(module.exports, { extra: 1 });",
    "export = function getUser() {};",
    "export const {getUser} = something;",
    "export function getUser() {} export function getUser() {}",
  ])("does not silently accept unsupported or invalid source: %s", (source) => {
    expect(analyzeSourceExports("/project/getUser.ts", source).isErr()).toBe(true);
  });

  it.each(["getUser.d.ts", "getUser.d.mts", "getUser.json"])("rejects unsupported file %s", (filename) => {
    expect(analyzeSourceExports(`/project/${filename}`, "export function getUser() {}").isErr()).toBe(true);
  });
});
