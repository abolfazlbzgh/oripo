import { lessonPreviews } from "./lesson-previews";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { locales, localeCodes } from "../app/i18n/locales";
import type { Common } from "../app/i18n/messages";
import { canonicalPaths, localPath, galleryPath } from "../app/navigation";
import { siteOrigin } from "../app/site";

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function writeStaticFiles(build: string, app: string) {
  const client = join(build, "client");
  await mkdir(join(client, "previews"), { recursive: true });
  for (const [path, image] of lessonPreviews()) await writeFile(join(client, path), image);
  // Every supported URL has its own document. Retire the framework’s generated SPA entry.
  await unlink(join(client, "__spa-fallback.html"));
  const origin = siteOrigin(process.env.ORIPO_SITE_URL);
  await writeFile(
    join(client, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${canonicalPaths.map((path) => `  <url><loc>${escape(origin + path)}</loc></url>`).join("\n")}\n</urlset>\n`,
  );
  await mkdir(join(client, "errors"), { recursive: true });
  for (const locale of localeCodes) {
    const common: Common = JSON.parse(
      await readFile(join(app, "i18n", locale, "common.json"), "utf8"),
    );
    const home = await readFile(join(client, locale, "index.html"), "utf8");
    const styles = home.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)?.join("");
    if (!styles) throw new Error("Missing prerendered stylesheet for " + locale);
    const { font, dir } = locales[locale];
    const html = `<!doctype html><html lang="${locale}" dir="${dir}" class="font-${font}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="description" content="${escape(common.error.body)}"><title>${escape(common.error.title)} · Oripo</title><link rel="icon" href="/oripo.svg"><script src="/appearance.js"></script>${styles}</head>
<body><header class="masthead"><div class="frame masthead-inner"><a tabindex="0" class="wordmark" href="${localPath(locale)}" dir="ltr"><img src="/oripo.svg" width="36" height="36" alt="">Oripo</a></div></header>
<main class="frame content article-head"><p class="eyebrow">404</p><h1>${escape(common.error.title)}</h1><p class="intro">${escape(common.error.body)}</p><nav class="hero-actions" aria-label="${escape(common.error.recovery)}"><a class="btn btn-primary" href="${galleryPath(locale)}">${escape(common.nav.explore)}</a><a class="btn btn-outline" href="${localPath(locale, "creaseGuide")}">${escape(common.nav.guide)}</a></nav></main><footer class="frame footer-inner">Oripo · ${escape(common.home.tagline)}</footer></body></html>`;
    await writeFile(join(client, "errors", locale + ".html"), html);
    if (locale === "en") await writeFile(join(client, "404.html"), html);
  }
}
