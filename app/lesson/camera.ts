import type { Point } from "../fold/geometry";
import type { Viewpoint } from "../fold/studio.client";

export type ViewCue = { position: Point; transitionMs: number };
export type CameraCues = { steps?: readonly (ViewCue & { step: string })[]; finished?: ViewCue };
export const poleMargin = Math.PI / 24;
export const revealMs = 100;
export function resolveViews(
  steps: readonly { id: string }[],
  view: Viewpoint,
  camera?: CameraCues,
) {
  const cues = new Map(camera?.steps?.map((c) => [c.step, c]));
  let current: ViewCue = { position: view.position, transitionMs: 600 };
  return [
    ...steps.map(({ id }) => (current = cues.get(id) ?? current)),
    camera?.finished ?? current,
  ];
}

export function validateViews(
  steps: readonly { id: string }[],
  view: Viewpoint,
  camera?: CameraCues,
) {
  const ids = (camera?.steps ?? []).map((c) => c.step);
  if (new Set(ids).size !== ids.length) throw Error("Duplicate camera step");
  for (const id of ids)
    if (!steps.some((s) => s.id === id)) throw Error("Unknown camera step " + id);
  if (!camera) return;
  for (const cue of resolveViews(steps, view, camera)) {
    const r = Math.hypot(...cue.position),
      polar = Math.acos(cue.position[2] / r);
    if (
      !Number.isFinite(r) ||
      r < view.minDistance ||
      r > view.maxDistance ||
      !Number.isFinite(polar) ||
      polar < poleMargin ||
      polar > (view.inspectBack ? Math.PI : Math.PI / 2) - poleMargin ||
      !Number.isInteger(cue.transitionMs) ||
      cue.transitionMs < 200 ||
      cue.transitionMs > 1200
    )
      throw Error("Camera cue outside orbit or timing bounds");
  }
}
export function sameEye(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-6;
}

// Z-up spherical interpolation follows the shortest azimuth and stays inside
// the convex polar/radius limits enforced by OrbitControls.
export function orbitEye(a: Point, b: Point, f: number): Point {
  if (f <= 0) return a;
  if (f >= 1) return b;
  const t = f * f * (3 - 2 * f),
    lerp = (x: number, y: number) => x + (y - x) * t;
  const az = Math.atan2(a[1], a[0]),
    delta = Math.atan2(b[1], b[0]) - az;
  const angle = az + t * Math.atan2(Math.sin(delta), Math.cos(delta));
  const radius = lerp(Math.hypot(...a), Math.hypot(...b));
  const elevation = (p: Point) => Math.atan2(p[2], Math.hypot(p[0], p[1]));
  const e = lerp(elevation(a), elevation(b)),
    xy = radius * Math.cos(e);
  return [xy * Math.cos(angle), xy * Math.sin(angle), radius * Math.sin(e)];
}
