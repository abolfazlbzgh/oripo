import { atIndex, difference, poseAt, tolerance, type CompiledLesson, type Pose } from "./geometry";
import type { Point } from "../fold/geometry";

export type GuideEdge = {
  a: number;
  b: number;
  face: number;
  crease: string;
  startDistance: number;
  endDistance: number;
};

function onSegment(p: Point, a: Point, b: Point) {
  const [x, y, z] = difference(p, a),
    [dx, dy, dz] = difference(b, a);
  const length = Math.hypot(dx, dy, dz);
  const along = (x * dx + y * dy + z * dz) / length;
  return (
    along >= -tolerance &&
    along <= length + tolerance &&
    Math.hypot(y * dz - z * dy, z * dx - x * dz, x * dy - y * dx) <= tolerance * length
  );
}

export function guideEdges(model: CompiledLesson): GuideEdge[][] {
  const stock = atIndex(model.poses, 0);
  return model.steps.map((step, i) => {
    const start = atIndex(model.poses, i),
      middle = poseAt(model, i, 0.5);
    const moving = model.faces.map((f) =>
      f.vertices.some(
        (v) => Math.hypot(...difference(atIndex(middle, v), atIndex(start, v))) > tolerance,
      ),
    );
    return step.guides.flatMap((crease) => {
      const ends = model.creases.get(crease);
      if (!ends) throw Error("Unknown score " + crease);
      const turns = step.turns.filter((t) => t.crease === crease);
      const packet = new Set(turns.flatMap((t) => t.faces));
      // Turn endpoints define the axis in the folded packet. Field guides name
      // material scores, including scores articulated by an earlier closure.
      const reference = packet.size ? start : stock;
      const a = atIndex(reference, ends[0]),
        b = atIndex(reference, ends[1]);
      const traces = model.edges.filter(
        (edge) =>
          onSegment(atIndex(reference, edge.a), a, b) &&
          onSegment(atIndex(reference, edge.b), a, b),
      );
      const along = (v: number) => Math.hypot(...difference(atIndex(reference, v), a));
      type Edge = (typeof model.edges)[number];
      const lines = traces.map((edge) => ({
        edge,
        startDistance: along(edge.a),
        endDistance: along(edge.b),
      }));
      // A coupled field can carry stacked copies of a score. Accept another
      // edge only if it follows the material score into the fold.
      if (step.charts) {
        const follows = (edge: Edge, trace: Edge, pose: Pose) =>
          [edge.a, edge.b].every((v) =>
            onSegment(atIndex(pose, v), atIndex(pose, trace.a), atIndex(pose, trace.b)),
          );
        for (const edge of model.edges) {
          if (traces.includes(edge) || !edge.faces.some((f) => moving[f])) continue;
          const trace = traces.find((t) => follows(edge, t, start) && follows(edge, t, middle));
          if (!trace) continue;
          const origin = atIndex(start, trace.a),
            sign = Math.sign(along(trace.b) - along(trace.a));
          const distance = (v: number) =>
            along(trace.a) + sign * Math.hypot(...difference(atIndex(start, v), origin));
          lines.push({ edge, startDistance: distance(edge.a), endDistance: distance(edge.b) });
        }
      }
      const incident = lines.flatMap(({ edge, startDistance, endDistance }) =>
        edge.faces.map((face) => ({
          a: edge.a,
          b: edge.b,
          face,
          crease,
          startDistance,
          endDistance,
        })),
      );
      const active = incident.filter((e) => (packet.size ? packet.has(e.face) : moving[e.face]));
      return active.length ? active : incident;
    });
  });
}

export function guidePoint(pose: Pose, offsets: Pose, vertex: number, face: number): Point {
  const [x, y, z] = atIndex(pose, vertex);
  const d = atIndex(offsets, face);
  return [x + d[0], y + d[1], z + d[2]];
}
