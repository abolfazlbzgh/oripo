import { atIndex } from "../../app/lesson/geometry";
import { it, expect } from "vitest";
import { groupByDifficulty, lessons, difficultyOrder } from "../../app/lessons";
import { airplane, airplaneHingePlies } from "../../app/lesson/airplane";
import { projectPaper } from "../../scripts/paper-preview";
import { inflateSync } from "node:zlib";

it("orders human difficulty groups without deriving identifiers or group sizes from rank", () => {
  const entries = Array.from({ length: 47 }, (_, i) => ({
    id: "model-" + (100 - i),
    difficulty: atIndex(difficultyOrder, (i + 2) % 3),
  }));
  const tiers = groupByDifficulty(entries);
  expect(tiers.map((t) => t.difficulty)).toEqual(difficultyOrder);
  expect(tiers.map((t) => t.entries.length)).toEqual([16, 15, 16]);
  expect(
    tiers
      .flatMap((t) => t.entries)
      .map((e) => e.id)
      .sort(),
  ).toEqual(entries.map((e) => e.id).sort());
  expect(new Set(lessons.map((m) => m.id)).size).toBe(lessons.length);
  expect(lessons.filter((m) => m.difficulty === "beginner").map((m) => m.id)).toEqual([
    "paper-airplane",
    "paper-heart",
    "fox-face",
  ]);
});
it("changes preview pigments without changing coverage or other models' palettes", () => {
  const render = (color: string) =>
    projectPaper(
      airplane,
      airplaneHingePlies,
      { front: color, reverse: color, edge: color },
      [2, -3, 4],
    );
  function scanlines(png: Buffer) {
    const size = png.readUInt32BE(33);
    return inflateSync(png.subarray(41, 41 + size));
  }
  const a = scanlines(render("#ff0000")),
    b = scanlines(render("#0000ff"));
  let covered = 0;
  for (let row = 0; row < 312; row++)
    for (let x = 0; x < 440; x++) {
      const i = row * (440 * 4 + 1) + 1 + x * 4;
      if (a[i + 3] !== b[i + 3]) throw Error("Palette changed the silhouette");
      if (a[i + 3] === 255) {
        covered++;
        if (!a[i] || a[i + 2] || b[i] || !b[i + 2])
          throw Error("Pigment override did not reach a panel");
      }
    }
  expect(covered).toBeGreaterThan(10000);
  expect(new Set(lessons.map((l) => l.finishedAppearance.reverse)).size).toBe(lessons.length);
});
