export type Point = readonly [x: number, y: number, z: number];
export type Panel = readonly [Point, Point, Point, Point];

export const crease = [
  [0, -1, 0],
  [0, 1, 0],
] as const;

// Counterclockwise seen from +Z. Both panels use the same two hinge vertices.
export const fixedPanel: Panel = [[-1, -1, 0], crease[0], crease[1], [-1, 1, 0]];
export const movingPanel: Panel = [crease[0], [1, -1, 0], [1, 1, 0], crease[1]];

export function clampProgress(progress: number) {
  return Number.isNaN(progress) ? 0 : Math.max(0, Math.min(1, progress));
}

export function hingeRotationY(progress: number) {
  return -Math.PI * clampProgress(progress);
}

/** Rotate the original right panel about -Y, raising its outside edge toward +Z. */
export function movingPanelAt(progress: number): Panel {
  const angle = hingeRotationY(progress);
  const cosine = Math.cos(angle);
  const rise = angle === -Math.PI ? 0 : -Math.sin(angle);
  function rotate([x, y]: Point): Point {
    return [x * cosine, y, x * rise];
  }
  return [crease[0], rotate(movingPanel[1]), rotate(movingPanel[2]), crease[1]];
}
