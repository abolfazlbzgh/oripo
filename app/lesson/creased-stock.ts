import { atIndex, type FoldStep } from "./geometry";
import { splitPanel, weldPanels, type Corner, type XY } from "./flat-pattern";

type Panel = { corners: Corner[]; packets: string[] };
type Line = readonly [XY, XY];
export function creasedStock(boundary: readonly XY[]) {
  let panels: Panel[] = [
    { corners: boundary.map((p) => ({ material: p, posed: p })), packets: [] },
  ];
  const hinges = new Map<string, Line>();
  /** Split the selected flat material along a line oriented with its moving packet to the left.
   * A hem also reflects the construction coordinates for later marks through its two plies. */
  function cut(
    id: string,
    [a, b]: Line,
    select: (packets: readonly string[]) => boolean = () => true,
    hem = false,
  ) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = Math.hypot(dx, dy);
    if (length < 1e-9 || hinges.has(id)) throw Error("Invalid material line " + id);
    const nx = -dy / length,
      ny = dx / length;
    const side = (p: XY) => (p[0] - a[0]) * nx + (p[1] - a[1]) * ny;
    const ends: Corner[] = [];
    panels = panels.flatMap((panel) => {
      if (!select(panel.packets)) return [panel];
      const distances = panel.corners.map((c) => side(c.posed));
      const { moving, fixed } = splitPanel(panel.corners, distances);
      ends.push(
        ...panel.corners.filter((c) => Math.abs(side(c.posed)) < 1e-9),
        ...moving.filter((c) => Math.abs(side(c.posed)) < 1e-9),
      );
      if (!distances.some((d) => d > 1e-9)) return [panel];
      const result: Panel[] = [];
      if (distances.some((d) => d < -1e-9)) result.push({ corners: fixed, packets: panel.packets });
      result.push({
        corners: hem
          ? moving.map(({ material, posed }) => ({
              material,
              posed: [posed[0] - 2 * side(posed) * nx, posed[1] - 2 * side(posed) * ny],
            }))
          : moving,
        packets: [...panel.packets, id],
      });
      return result;
    });
    ends.sort((p, q) => (p.posed[0] - q.posed[0]) * dx + (p.posed[1] - q.posed[1]) * dy);
    if (ends.length < 2) throw Error("Missing material line " + id);
    hinges.set(id, [atIndex(ends, 0).material, atIndex(ends, ends.length - 1).material]);
  }
  const ids = (id: string) =>
    panels.flatMap((p, i) => (p.packets.includes(id) ? ["panel-" + i] : []));
  function turn(id: string, crease: string, degrees: number): FoldStep {
    return { id, durationMs: 1450, turns: [{ crease, degrees, faces: ids(crease) }] };
  }
  return { cut, ids, turn, sheet: () => weldPanels(panels, hinges) };
}
export function pinAt(sheet: ReturnType<ReturnType<typeof creasedStock>["sheet"]>, p: XY) {
  const pin = Object.entries(sheet.vertices).find(
    ([, v]) => Math.hypot(v[0] - p[0], v[1] - p[1]) < 1e-8,
  );
  if (!pin) throw Error("Missing material pin at " + p.join(","));
  return pin[0];
}
