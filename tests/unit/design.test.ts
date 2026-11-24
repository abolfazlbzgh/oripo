import { fixture } from "../model-fixture";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { groupByDifficulty, lessons } from "../../app/lessons";
import { localPath, publishedPaths } from "../../app/navigation";

it("gives each gallery demonstration a unique ID and a published address", () => {
  const items = lessons;
  expect(new Set(items.map((lesson) => lesson.id)).size).toBe(items.length);
  expect(new Set(items.map((lesson) => localPath("en", lesson.id))).size).toBe(items.length);
  for (const lesson of items) expect(publishedPaths).toContain(localPath("en", lesson.id));
});

it("publishes complete lessons with their actual action counts", () => {
  for (const { id, stepCount } of lessons) expect(stepCount).toBe(fixture(id).pattern.steps.length);
  expect(lessons.every((l) => l.availability === "playable" && l.paper)).toBe(true);
  expect(
    groupByDifficulty(lessons).map(({ difficulty, entries }) => [
      difficulty,
      entries.map((l) => l.id),
    ]),
  ).toEqual([
    ["beginner", ["paper-airplane", "paper-heart", "fox-face"]],
    ["intermediate", ["masu-box", "jumping-frog", "herringbone-map"]],
    ["advanced", ["pinwheel-calyx", "river-tern", "hex-iris"]],
  ]);
});

const css = readFileSync(new URL("../../app/styles.css", import.meta.url), "utf8");

function luminance(hex: string) {
  const channel = (offset: number) => {
    const s = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

it.each(["oripo-light", "oripo-dark"])("%s semantic text pairs reach 4.5:1 contrast", (name) => {
  const block = css.split(`name: "${name}";`)[1]?.split("}")[0] ?? "";
  const tokens = new Map(
    Array.from(block.matchAll(/--color-([\w-]+):\s*#([\da-f]{6});/gi), ([, role, hex]) => [
      role,
      hex,
    ]),
  );
  const pairs = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "info",
    "success",
    "warning",
    "error",
  ].map((role) => [role, role + "-content"]);
  for (const surface of ["base-100", "base-200", "base-300"]) pairs.push([surface, "base-content"]);
  for (const ink of ["primary", "secondary"]) pairs.push(["base-100", ink]);
  for (const [bg, fg] of pairs) {
    const a = tokens.get(bg),
      b = tokens.get(fg);
    if (!a || !b) throw new Error(`Missing color pair ${bg}/${fg}`);
    const l1 = luminance(a),
      l2 = luminance(b);
    expect(
      (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
      `${name} ${bg}/${fg}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});
