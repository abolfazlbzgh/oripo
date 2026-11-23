import { clampProgress, type Point } from "../fold/geometry";

export type Face = { id: string; vertices: readonly string[] };
export type Turn = { crease: string; faces: readonly string[]; degrees: number };
export type FoldStep = { id: string; durationMs: number; turns: readonly Turn[] };
export type LessonPattern = {
  version: 1;
  lessonId: string;
  sheet: {
    vertices: Readonly<Record<string, Point>>;
    faces: readonly Face[];
    creases: Readonly<Record<string, readonly [string, string]>>;
  };
  steps: readonly FoldStep[];
};

export const tolerance = 1e-6;
export function atIndex<T>(items: readonly T[], index: number): T {
  const value = items[index];
  if (value === undefined)
    throw new RangeError(`Missing entry ${index} in a list of length ${items.length}`);
  return value;
}
export type Pose = readonly Point[];
export type PreparedTurn = {
  crease: string;
  origin: Point;
  axis: Point;
  degrees: number;
  vertices: number[];
  faces: number[];
};
type PreparedStep = { id: string; durationMs: number; turns: PreparedTurn[] };
type SheetEdge = { a: number; b: number; faces: number[] };
export type CompiledLesson = {
  lessonId: string;
  vertexIds: string[];
  faces: { id: string; vertices: number[] }[];
  edges: SheetEdge[];
  creases: Map<string, readonly [number, number]>;
  poses: Pose[];
  steps: PreparedStep[];
};

function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function uniqueIds(ids: readonly string[], kind: string) {
  requireValue(ids.length && ids.every((id) => /^[a-z][a-z0-9-]*$/.test(id)), `Invalid ${kind} ID`);
  requireValue(new Set(ids).size === ids.length, `Duplicate ${kind} ID`);
}

export function difference(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Point, b: Point): Point {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// Exact quarter-turn endpoints keep full closures and their unfolds reproducible.
export function turnAngle(degrees: number, progress: number) {
  const quarters = (degrees * progress) / 90;
  if (Number.isInteger(quarters)) {
    const i = ((quarters % 4) + 4) % 4;
    return { sine: atIndex([0, 1, 0, -1], i), cosine: atIndex([1, 0, -1, 0], i) };
  }
  const radians = quarters * (Math.PI / 2);
  return { sine: Math.sin(radians), cosine: Math.cos(radians) };
}

export function rotate(
  point: Point,
  origin: Point,
  axis: Point,
  angle: ReturnType<typeof turnAngle>,
): Point {
  const tangent = cross(axis, difference(point, origin));
  const inward = cross(axis, tangent);
  const k = 1 - angle.cosine;
  return [
    point[0] + angle.sine * tangent[0] + k * inward[0],
    point[1] + angle.sine * tangent[1] + k * inward[1],
    point[2] + angle.sine * tangent[2] + k * inward[2],
  ];
}

function applyTurns(start: Pose, turns: readonly PreparedTurn[], progress: number): Pose {
  const result = [...start];
  for (const turn of turns) {
    const angle = turnAngle(turn.degrees, progress);
    for (const v of turn.vertices)
      result[v] = rotate(atIndex(start, v), turn.origin, turn.axis, angle);
  }
  return result;
}

function linkEdges(rest: Pose, faces: CompiledLesson["faces"]) {
  const edges = new Map<string, SheetEdge>();
  const neighbors = faces.map(() => [] as number[]);
  for (const [f, face] of faces.entries()) {
    let twiceArea = 0;
    for (const [i, a] of face.vertices.entries()) {
      const b = atIndex(face.vertices, (i + 1) % face.vertices.length);
      const start = atIndex(rest, a),
        end = atIndex(rest, b);
      const direction = difference(end, start);
      twiceArea += start[0] * end[1] - start[1] * end[0];
      requireValue(
        Math.hypot(...direction) > tolerance &&
          face.vertices.every(
            (v) =>
              cross(direction, difference(atIndex(rest, v), start))[2] >= -tolerance * tolerance,
          ),
        `Expected a convex counterclockwise face at ${face.id}`,
      );
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      const shared = edges.get(key);
      if (shared) {
        requireValue(shared.a === b && shared.faces.length === 1, `Invalid shared edge ${key}`);
        const adjacent = atIndex(shared.faces, 0);
        atIndex(neighbors, f).push(adjacent);
        atIndex(neighbors, adjacent).push(f);
        shared.faces.push(f);
      } else edges.set(key, { a, b, faces: [f] });
    }
    requireValue(twiceArea > tolerance * tolerance, `Degenerate face ${face.id}`);
  }
  const connected = new Set([0]);
  for (const f of connected) for (const next of atIndex(neighbors, f)) connected.add(next);
  requireValue(
    connected.size === faces.length && rest.length - edges.size + faces.length === 1,
    "Expected one connected sheet without holes",
  );
  return [...edges.values()];
}

export function compileLesson({ version, lessonId, sheet, steps }: LessonPattern): CompiledLesson {
  requireValue(version === 1, "Unsupported lesson version");
  uniqueIds([lessonId], "lesson");
  uniqueIds(
    steps.map((s) => s.id),
    "step",
  );
  const vertexIds = Object.keys(sheet.vertices);
  const faceIds = sheet.faces.map((f) => f.id);
  uniqueIds(vertexIds, "vertex");
  uniqueIds(faceIds, "face");
  uniqueIds(Object.keys(sheet.creases), "crease");
  const rest = Object.values(sheet.vertices);
  requireValue(
    rest.every((v) => v.length === 3 && v.every(Number.isFinite) && v[2] === 0),
    "Invalid sheet vertex",
  );
  const vertex = (id: string) => {
    const i = vertexIds.indexOf(id);
    requireValue(i >= 0, `Unknown vertex ${id}`);
    return i;
  };
  const incident = rest.map(() => [] as number[]);
  const faces = sheet.faces.map((face, index) => {
    const vertices = face.vertices.map(vertex);
    requireValue(
      vertices.length >= 3 && new Set(vertices).size === vertices.length,
      `Invalid face ${face.id}`,
    );
    for (const v of vertices) atIndex(incident, v).push(index);
    return { id: face.id, vertices };
  });
  requireValue(
    incident.every((list) => list.length),
    "Unused sheet vertex",
  );
  const edges = linkEdges(rest, faces);
  const creases = new Map(
    Object.entries(sheet.creases).map(([id, [a, b]]) => [id, [vertex(a), vertex(b)] as const]),
  );
  const poses: Pose[] = [rest];
  const prepared = steps.map(({ id, durationMs, turns }) => {
    requireValue(
      Number.isFinite(durationMs) && durationMs > 0 && turns.length,
      `Invalid step ${id}`,
    );
    const start = atIndex(poses, poses.length - 1);
    const owner = new Map<number, number>();
    const rotations = turns.map((turn, index): PreparedTurn => {
      const ends = creases.get(turn.crease);
      requireValue(ends, `Unknown crease ${turn.crease}`);
      requireValue(
        Number.isFinite(turn.degrees) && Math.abs(turn.degrees) <= 180 && turn.degrees !== 0,
        `Invalid angle in ${id}`,
      );
      const origin = atIndex(start, ends[0]);
      const line = difference(atIndex(start, ends[1]), origin);
      const length = Math.hypot(...line);
      requireValue(length > tolerance, `Collapsed crease ${turn.crease}`);
      const axis: Point = [line[0] / length, line[1] / length, line[2] / length];
      requireValue(turn.faces.length, `Missing moving faces in ${id}`);
      const moving = turn.faces.map((name) => {
        const f = faceIds.indexOf(name);
        requireValue(f >= 0, `Unknown face ${name}`);
        requireValue(!owner.has(f), `Face assigned twice in ${id}`);
        owner.set(f, index);
        return f;
      });
      return {
        crease: turn.crease,
        origin,
        axis,
        degrees: turn.degrees,
        faces: moving,
        vertices: [],
      };
    });
    // A material vertex shared by different packets must lie on every incident moving hinge.
    for (const [v, neighbors] of incident.entries()) {
      const owners = new Set(neighbors.map((f) => owner.get(f)));
      for (const index of owners) {
        if (index === undefined) continue;
        const turn = atIndex(rotations, index);
        if (owners.size === 1) turn.vertices.push(v);
        else
          requireValue(
            Math.hypot(...cross(turn.axis, difference(atIndex(start, v), turn.origin))) <=
              tolerance,
            `Off-axis seam in ${id} at ${vertexIds[v]}`,
          );
      }
    }
    poses.push(applyTurns(start, rotations, 1));
    return { id, durationMs, turns: rotations };
  });
  return { lessonId, vertexIds, faces, edges, creases, poses, steps: prepared };
}

export function poseAt(lesson: CompiledLesson, step: number, progress: number): Pose {
  const p = clampProgress(progress);
  if (p === 0 || p === 1) return atIndex(lesson.poses, step + p);
  return applyTurns(atIndex(lesson.poses, step), atIndex(lesson.steps, step).turns, p);
}
