import { lessons } from "../../app/lessons";
import { expect, it } from "vitest";
import { matchRoutes } from "react-router";
import routes from "../../app/routes";
import {
  canonicalPaths,
  identifyPath,
  labPath,
  localPath,
  prerenderPaths,
  publishedPaths,
} from "../../app/navigation";
import { localeCodes } from "../../app/i18n/locales";
import { siteOrigin } from "../../app/site";
import hosting from "../../vercel.json";

it("keeps English sharing URLs canonical", () => expect(localPath("en")).toBe("/en"));
it("preserves the guide hierarchy in every locale", () => {
  for (const locale of localeCodes)
    expect(localPath(locale, "creaseGuide")).toBe(`/${locale}/guide/crease-notation`);
});
it("enumerates all public routes once and keeps a single internal lab", () => {
  expect(localeCodes).toEqual(["en", "fa", "es", "fr", "zh-Hans", "ar", "pt-BR", "de", "ja", "hi"]);
  expect(canonicalPaths).toHaveLength(localeCodes.length * (2 + lessons.length));
  expect(publishedPaths).toHaveLength(canonicalPaths.length + 1);
  expect(prerenderPaths).toHaveLength(publishedPaths.length + 1);
  expect(new Set(prerenderPaths).size).toBe(prerenderPaths.length);
  expect(publishedPaths).not.toContain(labPath);
  for (const path of prerenderPaths) {
    expect(
      matchRoutes(
        routes.map(({ path }) => ({ path })),
        path,
      ),
    ).toHaveLength(1);
    expect(identifyPath(path)).toBeDefined();
  }
  for (const path of ["/xx", "/fr/lab/first-fold", "/ja/lessons/dart", "/en/other"])
    expect(identifyPath(path)).toBeUndefined();
  const errorRule = new RegExp("^" + hosting.routes[1]?.src + "$");
  for (const locale of localeCodes) expect(errorRule.test("/" + locale + "/missing")).toBe(true);
});
it("requires a public HTTPS origin or a local preview", () => {
  expect(siteOrigin()).toBe("http://127.0.0.1:4173");
  expect(siteOrigin("https://oripo.example/")).toBe("https://oripo.example");
  for (const invalid of [
    "https://oripo.example/path",
    "http://oripo.example",
    "https://name@oripo.example",
  ])
    expect(() => siteOrigin(invalid)).toThrow();
});
