import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnatomyModelConfigSchema } from "./AnatomyModelConfigSchema.js";
import { generateAnatomy } from "./generateAnatomy.js";
import { getModelConfigPath } from "./getModelConfigPath.js";
import { AnatomyModelError } from "./AnatomyModelError.js";
import { parseCliArguments } from "./parseCliArguments.js";
import { readModelConfig } from "./readModelConfig.js";
import { runModelConfig } from "./runModelConfig.js";

const root = resolve(import.meta.dirname, "../../..");
let temporary: string;
const servers: Server[] = [];
beforeEach(() => {
  mkdirSync(join(root, "docs/llm-generation"), { recursive: true });
  temporary = mkdtempSync(join(root, "docs/llm-generation/test-"));
});
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
  rmSync(temporary, { recursive: true, force: true });
});
const definition = () => ({ name: "Services", purpose: "Shared service file conventions", structure: {
  rootMode: "contents", defaultPolicies: { missingRequired: "block", unexpectedEntry: "block", nameMismatch: "block", nestingMismatch: "block" },
  bindings: { Name: { format: "PascalCase" } },
  root: { children: [{ kind: "file", name: { type: "placeholder", value: "<Name>Service.ts" }, quantity: "one_or_more" }] },
} });
const provider = async (texts: string[], status = 200) => {
  const requests: { path: string; authorization: string | undefined; body: { model: string; messages: { role: string; content: string }[]; response_format?: unknown } }[] = [];
  const server = createServer((request, response) => {
    let raw = "";
    request.on("data", (data) => { raw += data.toString(); });
    request.on("end", () => {
      requests.push({ path: request.url!, authorization: request.headers.authorization, body: JSON.parse(raw) });
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: texts[Math.min(requests.length - 1, texts.length - 1)] } }] }));
    });
  });
  servers.push(server);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("Missing fixture address");
  const config = AnatomyModelConfigSchema.parse({ baseUrl: `http://127.0.0.1:${address.port}/v1`, model: "test-model", apiKeyEnv: "ANATOMY_TEST_MODEL_KEY" });
  return { config, requests };
};
const tree = [{ kind: "file" as const, name: "UserService.ts" }, { kind: "file" as const, name: "OrderService.ts" }];

describe("model settings", () => {
  it("saves, updates and displays settings without storing a key", async () => {
    const path = join(temporary, "model.json");
    const output = vi.fn();
    expect((await runModelConfig(["--base-url", "http://localhost:1234/v1", "--model", "local-model", "--api-key-env", "MY_MODEL_KEY", "--model-config", path], output)).isOk()).toBe(true);
    expect((await runModelConfig(["--model", "updated-model", "--no-json-mode", "--model-config", path], output)).isOk()).toBe(true);
    expect((await readModelConfig(path))._unsafeUnwrap()).toMatchObject({ model: "updated-model", apiKeyEnv: "MY_MODEL_KEY", jsonMode: false });
    expect((await runModelConfig(["--show", "--model-config", path], output)).isOk()).toBe(true);
    expect(JSON.parse(output.mock.calls.at(-1)![0]).model).toBe("updated-model");
    expect(readFileSync(path, "utf8")).not.toContain('"apiKey":');
    expect(getModelConfigPath(undefined, { XDG_CONFIG_HOME: temporary })).toBe(join(temporary, "anatomy/model.json"));
  });
  it.each([
    ["--api-key", "secret"], ["--base-url"], ["--base-url", "ftp://host", "--model", "m"],
    ["--base-url", "https://user:secret@host/v1", "--model", "m"], ["--model", "m"],
  ])("rejects invalid setup %j without creating a file", async (...args) => {
    const path = join(temporary, "model.json");
    expect((await runModelConfig([...args, "--model-config", path], vi.fn())).isErr()).toBe(true);
    expect((await readModelConfig(path)).isErr()).toBe(true);
  });
  it("rejects generation-only options and mixed scan modes", () => {
    expect(parseCliArguments(["src", "--generate", "--instructions", "Tests are optional"])._unsafeUnwrap()).toMatchObject({ generate: true, instructions: "Tests are optional" });
    for (const args of [["--generate", "--watch"], ["--generate", "--query", "."], ["--generate", "--bundle", "b.json"], ["--output", "a.json"]])
      expect(parseCliArguments(args).isErr()).toBe(true);
  });
});

describe("LLM-inferred Anatomy", () => {
  it("uses a real compatible HTTP request, current JSON Schema and user requirements", async () => {
    const service = await provider([JSON.stringify(definition())]);
    const result = (await generateAnatomy(tree, "services", "Reuse service naming patterns", service.config, "test-token"))._unsafeUnwrap();
    expect(JSON.parse(result.json).structure.root.children).toHaveLength(1);
    expect(JSON.parse(result.json).structure.root.children[0].name.type).toBe("placeholder");
    expect(result.summary.block).toBe(0);
    expect(service.requests).toHaveLength(1);
    expect(service.requests[0]).toMatchObject({ path: "/v1/chat/completions", authorization: "Bearer test-token", body: { model: "test-model", response_format: { type: "json_object" } } });
    const prompt = service.requests[0]!.body.messages;
    expect(prompt[0]!.content).toContain('"rootMode"');
    expect(prompt[0]!.content).toContain("untrusted data");
    expect(JSON.parse(prompt[1]!.content)).toEqual({ name: "services", instructions: "Reuse service naming patterns", tree });
    expect(JSON.stringify(prompt)).not.toContain("test-token");
  });
  it("repairs an invalid candidate once with validation feedback", async () => {
    const service = await provider(["{}", JSON.stringify(definition())]);
    expect((await generateAnatomy(tree, "services", "", service.config, "test-token")).isOk()).toBe(true);
    expect(service.requests).toHaveLength(2);
    expect(service.requests[1]!.body.messages.at(-1)!.content).toContain("Correct the JSON");
  });
  it("fails after two invalid outputs rather than returning a snapshot", async () => {
    const service = await provider(["not JSON"]);
    expect((await generateAnatomy(tree, "services", "", service.config, "test-token")).isErr()).toBe(true);
    expect(service.requests).toHaveLength(2);
  });
  it("retains a valid required-file rule even when the existing project violates it", async () => {
    const rule = definition();
    rule.structure.root.children[0]!.name = { type: "literal", value: "RequiredService.ts" };
    const service = await provider([JSON.stringify(rule)]);
    const result = (await generateAnatomy(tree, "services", "RequiredService.ts is required", service.config, "test-token"))._unsafeUnwrap();
    expect(result.summary.block).toBeGreaterThan(0);
    expect(JSON.parse(result.json).structure.root.children[0].name.value).toBe("RequiredService.ts");
    expect(service.requests).toHaveLength(1);
  });
  it("reports authorization failures without echoing a credential or provider body", async () => {
    const service = await provider(["provider body"], 401);
    const error = (await generateAnatomy(tree, "services", "", service.config, "test-token"))._unsafeUnwrapErr();
    expect(error.message).toContain("HTTP 401");
    expect(error.message).not.toContain("test-token");
    expect(service.requests).toHaveLength(1);
  });
  it("supports providers without JSON-mode parameters", async () => {
    const service = await provider([JSON.stringify(definition())]);
    expect((await generateAnatomy(tree, "services", "", { ...service.config, jsonMode: false }, "test-token")).isOk()).toBe(true);
    expect(service.requests[0]!.body.response_format).toBeUndefined();
  });
  it("fails before a request for a missing key or oversized directory context", async () => {
    const service = await provider([JSON.stringify(definition())]);
    expect((await generateAnatomy(tree, "services", "", service.config, "")).isErr()).toBe(true);
    expect((await generateAnatomy([{ kind: "file", name: "x".repeat(200_001) }], "services", "", service.config, "test-token")).isErr()).toBe(true);
    expect(service.requests).toHaveLength(0);
  });
  it("rejects unsupported response shapes and truncated completions", async () => {
    const service = await provider([JSON.stringify(definition())]);
    for (const body of [{ choices: [] }, { choices: [{ finish_reason: "length", message: { content: "{}" } }] }]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body)));
      expect((await generateAnatomy(tree, "services", "", service.config, "test-token", fetcher)).isErr()).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0]![1]).toMatchObject({ redirect: "error" });
    }
  });
  it("converts transport/timeouts into a typed operational error", async () => {
    const service = await provider([JSON.stringify(definition())]);
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    const result = await generateAnatomy(tree, "services", "", service.config, "test-token", fetcher);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(AnatomyModelError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
