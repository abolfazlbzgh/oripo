import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import type { LessonPackage } from "../app/lesson/package";
import type { Point } from "./browser/paper-pixels";
export type BatchId = "twin-stern-junk" | "reed-runner-dinosaur";
const source = (id: BatchId): LessonPackage =>
  JSON.parse(readFileSync("models/" + id + "/lesson.json", "utf8"));
const packages = {
  "twin-stern-junk": source("twin-stern-junk"),
  "reed-runner-dinosaur": source("reed-runner-dinosaur"),
};

// Independent construction of the wrapped hull. Rotate a unit gusset edge
// about the side ray until its free end is one unit from the end-wall ray.
function hull(x: number, y: number, t: number): Point {
  const sx = Math.sign(x),
    sy = Math.sign(y),
    u = Math.abs(x) - 0.115,
    v = Math.abs(y) - 0.25;
  const a = (t * 68 * Math.PI) / 180,
    b = (t * Math.PI) / 3;
  let X = Math.abs(x),
    Y = Math.abs(y),
    Z = 0;
  if (u > 0 && v > 0) {
    const phi =
      Math.atan2(Math.cos(a) * Math.sin(b), Math.cos(b)) +
      Math.acos(
        Math.min(
          1,
          (1 - Math.sin(a) * Math.sin(b)) / Math.hypot(Math.cos(b), Math.cos(a) * Math.sin(b)),
        ),
      );
    const diagonal = [
      Math.cos(a) - Math.sin(a) * Math.sin(phi),
      Math.cos(phi),
      Math.sin(a) + Math.cos(a) * Math.sin(phi),
    ] as const;
    const k = Math.min(u, v);
    X = 0.115 + Math.max(u - v, 0) * Math.cos(a) + k * diagonal[0];
    Y = 0.25 + Math.max(v - u, 0) * Math.cos(b) + k * diagonal[1];
    Z = Math.max(u - v, 0) * Math.sin(a) + Math.max(v - u, 0) * Math.sin(b) + k * diagonal[2];
  } else if (u > 0) {
    X = 0.115 + u * Math.cos(a);
    Z = u * Math.sin(a);
  } else if (v > 0) {
    Y = 0.25 + v * Math.cos(b);
    Z = v * Math.sin(b);
  }
  return [sx * X, sy * Y, Z];
}
function waterbomb(x: number, y: number): Point {
  if (y <= -Math.abs(x)) return [x, y, 0];
  if (y >= Math.abs(x)) return [x, -y, 0];
  return [Math.sign(x) * Math.abs(y), -Math.abs(x), 0];
}
// Start from the scored stock. Hinges use current endpoints and quaternion
// rotations from Three; neither the lesson compiler nor its charts run here.
export function batchPoints(id: BatchId, position: number) {
  const { pattern } = packages[id],
    { sheet } = pattern;
  let p = Object.fromEntries(
    Object.entries(sheet.vertices).map(([id, xyz]) => [id, new Vector3(...xyz)]),
  );
  for (const [i, step] of pattern.steps.entries()) {
    const t = Math.min(1, Math.max(0, position - i));
    if (t === 0) break;
    if (step.id === "open-the-hull" || step.id === "collapse-the-base") {
      if (step.id === "collapse-the-base" && t !== 1)
        throw Error("Only the collapsed base endpoint is specified");
      p = Object.fromEntries(
        Object.entries(p).map(([k, v]) => [
          k,
          new Vector3(...(step.id === "open-the-hull" ? hull(v.x, v.y, t) : waterbomb(v.x, v.y))),
        ]),
      );
      continue;
    }
    const next = { ...p };
    for (const turn of step.turns) {
      const ends = sheet.creases[turn.crease];
      if (!ends) throw Error("Missing axis");
      const a = p[ends[0]],
        b = p[ends[1]];
      if (!a || !b) throw Error("Missing axis endpoints");
      const axis = b.clone().sub(a).normalize(),
        moved = new Set(
          sheet.faces
            .filter((face) => turn.faces.includes(face.id))
            .flatMap((face) => face.vertices),
        );
      for (const k of moved) {
        const v = p[k];
        if (!v) throw Error("Missing material vertex");
        next[k] = v
          .clone()
          .sub(a)
          .applyAxisAngle(axis, (t * turn.degrees * Math.PI) / 180)
          .add(a);
      }
    }
    p = next;
  }
  return p;
}
export function batchOutline(id: BatchId, position: number): Point[][] {
  const pkg = packages[id],
    p = batchPoints(id, position),
    frame = pkg.presentation.view.materialFrame;
  if (!frame) throw Error("Missing authored model frame");
  const center = new Vector3(...frame.center);
  return pkg.pattern.sheet.faces.map((face) =>
    face.vertices.map((id) => {
      const v = p[id];
      if (!v) throw Error("Missing outline vertex");
      return v.clone().sub(center).multiplyScalar(frame.scale).toArray();
    }),
  );
}
