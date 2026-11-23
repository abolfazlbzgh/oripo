import { describe, expect, it } from "vitest";
import { englishPath, publishedPaths } from "../../app/navigation";
import routes from "../../app/routes";

describe("published English routes", () => {
  it("keeps the English index canonical without a trailing separator", () => {
    expect(englishPath("foundation")).toBe("/en");
  });

  it("retains the guide hierarchy when building an absolute link", () => {
    expect(englishPath("creaseGuide")).toBe("/en/guide/crease-notation");
  });

  it("pre-renders every registered page exactly once", () => {
    const paths = routes.map((route) => (route.path ? `/${route.path}` : "/"));
    expect([...publishedPaths].sort()).toEqual(paths.sort());
    expect(new Set(publishedPaths).size).toBe(publishedPaths.length);
  });
});
