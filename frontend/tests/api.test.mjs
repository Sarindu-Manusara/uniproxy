import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { api, ApiError } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("login returns the account in one request", async () => {
  const profile = { username: "demo", email: "demo@example.test", balance: 12.5, role: "USER" };
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ token: "signed-token", profile });
  };

  assert.deepEqual(await api.login("demo", "test-password"), { token: "signed-token", profile });
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).searchParams.get("includeProfile"), "true");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), { username: "demo", password: "test-password" });
});

test("login handles a backend that still returns only a token", async () => {
  globalThis.fetch = async () => new Response("legacy-token");
  assert.deepEqual(await api.login("demo", "test-password"), { token: "legacy-token", profile: null });
});

test("incorrect credentials do not create a session", async () => {
  globalThis.fetch = async () => new Response("Invalid username or password", { status: 401 });
  await assert.rejects(api.login("demo", "wrong-password"), (error) => error instanceof ApiError && error.status === 401);
});

test("duplicate preparation calls share one background health request", async () => {
  let complete;
  let calls = 0;
  globalThis.fetch = () => {
    calls += 1;
    return new Promise((resolve) => { complete = resolve; });
  };

  const first = api.prepareLogin();
  const second = api.prepareLogin();
  assert.equal(first, second);
  assert.equal(calls, 1);
  complete(Response.json({ status: "ok" }));
  await first;
});

test("a failed warmup does not block a later successful login", async () => {
  globalThis.fetch = async () => { throw new TypeError("Network unavailable"); };
  await api.prepareLogin();
  globalThis.fetch = async () => new Response("signed-token");
  assert.equal((await api.login("demo", "test-password")).token, "signed-token");
});

test("the login timeout also covers reading the response body", async () => {
  globalThis.fetch = async (_url, options) => ({
    headers: new Headers({ "Content-Type": "application/json" }),
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }),
  });

  await assert.rejects(api.login("demo", "test-password"), (error) => error instanceof ApiError && error.status === 408);
});
