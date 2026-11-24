import { once } from "node:events";
import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { createPreviewServer } from "./preview.mjs";

// Match previous release measurements: gzip each requested script independently.
const client = new URL("../build/client/", import.meta.url);
const assets = readdirSync(new URL("assets/", client)).filter((file) => file.endsWith(".js"));
const scripts = new Set(["appearance.js", ...assets.map((file) => "assets/" + file)]);
function bytes(files) {
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    const content = readFileSync(new URL(file, client));
    raw += content.length;
    gzip += gzipSync(content).length;
  }
  return { raw, gzip };
}

const lessons = readdirSync(new URL("en/lessons/", client), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => "/en/lessons/" + entry.name);
const server = createPreviewServer().listen(0, "127.0.0.1");
await once(server, "listening");
let browser;
try {
  browser = await chromium.launch();
  const report = { browser: browser.version(), allScripts: bytes(scripts), visits: [] };
  for (const width of [1440, 390]) {
    const shell = ["/", "/en", "/en/guide/crease-notation"];
    const routes =
      width === 1440 ? [...shell, "/en/lab/first-fold", ...lessons] : [...shell, ...lessons];
    for (const route of routes) {
      const page = await browser.newPage({
        viewport: { width, height: width === 1440 ? 900 : 844 },
      });
      const requested = new Set();
      const fonts = new Set();
      const warnings = new Set();
      page.on("response", (response) => {
        const file = new URL(response.url()).pathname.slice(1);
        if (response.ok() && file.endsWith(".woff2")) fonts.add(file);
        if (response.ok() && scripts.has(file)) requested.add(file);
      });
      page.on("console", (message) => {
        if (message.type() === "warning") warnings.add(message.text());
      });
      await page.goto(`http://127.0.0.1:${server.address().port}${route}`);
      await page
        .locator(
          shell.includes(route)
            ? ".theme-controller:enabled"
            : ".lab-camera:enabled, .studio-camera:enabled",
        )
        .first()
        .waitFor({ state: "attached" });
      await page.waitForFunction(
        () => performance.getEntriesByName("first-contentful-paint").length > 0,
      );
      const fcpMs = await page.evaluate(
        () => performance.getEntriesByName("first-contentful-paint")[0].startTime,
      );
      await page.evaluate(() => globalThis.document.fonts.ready);
      const scenes = [...requested].filter(
        (file) => file.includes(".client-") && !file.includes("/entry.client-"),
      );
      report.visits.push({
        route,
        width,
        fcpMs,
        scripts: requested.size,
        coldJs: bytes(requested),
        html: bytes([route === "/" ? "index.html" : route.slice(1) + "/index.html"]),
        fontBytes: bytes(fonts).raw,
        fonts: [...fonts],
        sceneJs: bytes(scenes),
        scenes,
        warnings: [...warnings],
      });
      await page.close();
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await server[Symbol.asyncDispose]();
}
