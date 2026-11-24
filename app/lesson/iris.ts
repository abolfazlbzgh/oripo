import type { Point } from "../fold/geometry";
import type { XY } from "./flat-pattern";
import { creasedStock, pinAt } from "./creased-stock";
import { irisSide } from "./hex-twist";
import { atIndex, compileLesson, type FoldStep } from "./geometry";
const radius = 0.6,
  outer = Array.from({ length: 6 }, (_, i) => irisSide(i, 1).pin);
const stock = creasedStock(outer),
  lines: Record<string, string[]> = {},
  guides: string[] = [];
const pins = Array.from({ length: 6 }, (_, i) => irisSide(i, radius));
const rails: { id: string; start: XY; end: XY }[] = [];
for (const [i, { pin, rail }] of pins.entries()) {
  const next = atIndex(pins, (i + 1) % 6).pin,
    hub = "hub-" + i;
  stock.cut(hub, [next, pin]);
  (lines["hub-" + (i % 3)] ??= []).push(hub);
  for (const [k, start] of [pin, next].entries()) {
    const id = "rail-" + i + "-" + k;
    const end: XY = [start[0] + rail[0], start[1] + rail[1]];
    const outward = rail[0] * start[1] - rail[1] * start[0] > 0;
    stock.cut(id, outward ? [start, end] : [end, start]);
    (lines[(k === 0 ? "outer-" : "inner-") + (i % 3)] ??= []).push(id);
    const length = Math.min(
      ...pins.map(({ normal }) => {
        const d = normal[0] * rail[0] + normal[1] * rail[1];
        return d > 1e-9
          ? (Math.sqrt(3) / 2 - normal[0] * start[0] - normal[1] * start[1]) / d
          : Infinity;
      }),
    );
    rails.push({
      id: id + "-segment",
      start,
      end: [start[0] + length * rail[0], start[1] + length * rail[1]],
    });
  }
}
const sheet = stock.sheet();
for (const [i, p] of pins.entries()) {
  const name = "hub-edge-" + i;
  sheet.creases[name] = [pinAt(sheet, p.pin), pinAt(sheet, atIndex(pins, (i + 1) % 6).pin)];
  guides.push(name);
}
for (const { id, start, end } of rails) {
  sheet.creases[id] = [pinAt(sheet, start), pinAt(sheet, end)];
  guides.push(id);
}
export const irisHinges: Record<string, Record<string, number>> = {};
function mark(family: string, i: number, release: boolean): FoldStep {
  const key = family + "-" + i,
    id = (release ? "release-" : "mark-") + key;
  const pair = lines[key];
  if (!pair || pair.length !== 2) throw Error("Missing paired references");
  const turns = pair.map((crease, j) => ({
    crease,
    degrees: (j === 0 ? 180 : -180) * (release ? -1 : 1),
    faces: stock.ids(crease),
  }));
  irisHinges[id] = Object.fromEntries(pair.map((crease, j) => [crease, j === 0 ? 0.5 : -0.5]));
  return { id, durationMs: 1350, turns };
}
export const irisSteps: FoldStep[] = [
  ...["hub", "outer", "inner"].flatMap((name) =>
    [0, 1, 2].flatMap((i) => [mark(name, i, false), mark(name, i, true)]),
  ),
  { id: "close-iris", turns: [], durationMs: 3600, field: { kind: "hex-twist", radius }, guides },
  { id: "open-relief", turns: [], durationMs: 2200, reopenTo: 0.26 },
];
export const iris = compileLesson({ version: 4, lessonId: "hex-iris", sheet, steps: irisSteps });
export const irisEye: Point = [1.45, -2.4, 2.55];
