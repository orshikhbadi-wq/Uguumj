import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";

test("build emits the production site and PWA artifacts", async () => {
  const clientDir = new URL("../dist/client/", import.meta.url);
  const rootFiles = await readdir(clientDir);
  assert.ok(rootFiles.includes("sw.js"));
  assert.ok(rootFiles.includes("favicon.svg"));

  const assetFiles = await readdir(new URL("../dist/client/assets/", import.meta.url));
  const prototypeBundle = assetFiles.find((file) => file.startsWith("UguumjArkhadPrototype-") && file.endsWith(".js"));
  assert.ok(prototypeBundle, "prototype client bundle should be emitted");

  const bundle = await readFile(join(new URL("../dist/client/assets/", import.meta.url).pathname, prototypeBundle), "utf8");
  assert.match(bundle, /Сэтгэлд хүрсэн амт/);
  assert.match(bundle, /Bity Seed/);
  assert.match(bundle, /Google/);
  assert.match(bundle, /Facebook/);
  assert.match(bundle, /OTP/);
});
