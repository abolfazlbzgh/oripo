import { atIndex } from "../../app/lesson/geometry";
import { dartOutline } from "./dart-pixels";
import { mapOutline } from "./herringbone-outline";
import { frogOutline } from "./frog-outline";
import type { Point } from "./paper-pixels";

export const heartOutline: Point[] = [
  [0, -0.25, 0],
  [0.55, 0.3, 0],
  [0.55, 0.45, 0],
  [0.35, 0.65, 0],
  [0.15, 0.65, 0],
  [0, 0.5, 0],
  [-0.15, 0.65, 0],
  [-0.35, 0.65, 0],
  [-0.55, 0.45, 0],
  [-0.55, 0.3, 0],
];
export const foxOutline: Point[] = [
  [0, -1, 0],
  [2 / 3, 0, 0],
  [7 / 13, 4 / 13, 0],
  [7 / 17, 0, 0],
  [-7 / 17, 0, 0],
  [-7 / 13, 4 / 13, 0],
  [-2 / 3, 0, 0],
];
const floor: Point[] = [
  [-0.5, -0.5, 0],
  [0.5, -0.5, 0],
  [0.5, 0.5, 0],
  [-0.5, 0.5, 0],
];
const walls = floor.map((p, i) => {
  const q = atIndex(floor, (i + 1) % 4);
  return [p, q, [q[0], q[1], 0.5], [p[0], p[1], 0.5]] as Point[];
});
export const finishedOutlines = {
  "jumping-frog": frogOutline(),
  "herringbone-map": mapOutline(),
  "masu-box": [floor, ...walls],
  "paper-heart": [heartOutline],
  "fox-face": [foxOutline],
  "paper-airplane": dartOutline({ left: 84, right: 84 }),
};
