import { clampProgress, type Point } from "../fold/geometry";
import { prepareCrimp, type Crimp } from "./spatial-crimp";
import {
  chartPoint,
  prepareChart,
  stationaryChart,
  type Chart,
  type RigidField,
} from "./rigid-field";

export type Face = { id: string; vertices: readonly string[] };
type CornerFold = { motion: "right-gusset"; carriedBy?: string };
export type Turn = {
  crease: string;
  faces: readonly string[];
  degrees: number;
  corner?: CornerFold;
};
export type FoldStep = {
  id: string;
  durationMs: number;
  turns: readonly Turn[];
  field?: RigidField;
  regions?: readonly { field: RigidField; faces: readonly string[] }[];
  crimps?: readonly Crimp[];
  /** Retrace the immediately preceding coupled closure to this fraction. */
  reopenTo?: number;
  guides?: readonly string[];
};
const operationKeys = ["field", "regions", "crimps", "reopenTo"] as const;
type OperationKind = "turns" | (typeof operationKeys)[number];
function operationKind(step: FoldStep): OperationKind {
  const active = operationKeys.filter((key) => step[key] !== undefined);
  if (active.length + Number(step.turns.length > 0) !== 1) {
    if (step.reopenTo !== undefined) throw Error("Invalid reopening of a coupled action");
    if (step.crimps) throw Error("Invalid spatial packet assignment");
    if (step.field && step.regions) throw Error("Ambiguous field assignment");
    throw Error(`Invalid step ${step.id}: expected one motion family`);
  }
  return active[0] ?? "turns";
}
export type LessonPattern = {
  version: 1 | 2 | 3 | 4;
  lessonId: string;
  sheet: {
    vertices: Readonly<Record<string, Point>>;
    faces: readonly Face[];
    creases: Readonly<Record<string, readonly [string, string]>>;
  };
  steps: readonly FoldStep[];
};

export const tolerance = 1e-6;
export function atIndex<T>(items: ArrayLike<T>, index: number): T {
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
  corner?: { carrier?: PreparedTurn };
};
type PreparedStep = {
  id: string;
  durationMs: number;
  turns: PreparedTurn[];
  guides: readonly string[];
  charts?: readonly ((p: number) => Chart)[];
  chartOwners?: readonly number[];
  reopenTo?: number;
};
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

// A bisected right corner bridges an upright side and a rising end wall.
export function packetAngle(turn: PreparedTurn, progress: number) {
  if (!turn.corner) return turnAngle(turn.degrees, progress);
  const wall = turnAngle(90, progress);
  // A shared unit diagonal must project to one on BOTH boundary rays.
  const cosine = wall.cosine / (1 + wall.sine);
  return { cosine, sine: Math.sign(turn.degrees) * Math.sqrt(Math.max(0, 1 - cosine * cosine)) };
}

function packetTransform(turn: PreparedTurn, progress: number) {
  const angle = packetAngle(turn, progress);
  const carrier = turn.corner?.carrier;
  const carried = carrier && turnAngle(carrier.degrees, progress);
  return (p: Point) => {
    const local = rotate(p, turn.origin, turn.axis, angle);
    return carrier && carried ? rotate(local, carrier.origin, carrier.axis, carried) : local;
  };
}

function applyTurns(start: Pose, turns: readonly PreparedTurn[], progress: number): Pose {
  const result = [...start];
  for (const turn of turns) {
    const apply = packetTransform(turn, progress);
    for (const v of turn.vertices) result[v] = apply(atIndex(start, v));
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

export function compileSheet(sheet: LessonPattern["sheet"]) {
  const vertexIds = Object.keys(sheet.vertices);
  const faceIds = sheet.faces.map((f) => f.id);
  uniqueIds(vertexIds, "vertex");
  uniqueIds(faceIds, "face");
  if (Object.keys(sheet.creases).length) uniqueIds(Object.keys(sheet.creases), "crease");
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
    Object.entries(sheet.creases).map(([id, [a, b]]) => {
      requireValue(a !== b, `Collapsed crease ${id}`);
      return [id, [vertex(a), vertex(b)] as const] as const;
    }),
  );
  return { vertexIds, faceIds, rest, vertex, incident, faces, edges, creases };
}

export function compileLesson({ version, lessonId, sheet, steps }: LessonPattern): CompiledLesson {
  requireValue([1, 2, 3, 4].includes(version), "Unsupported lesson version");
  uniqueIds([lessonId], "lesson");
  uniqueIds(
    steps.map((s) => s.id),
    "step",
  );
  const { vertexIds, faceIds, rest, vertex, incident, faces, edges, creases } = compileSheet(sheet);
  const poses: Pose[] = [rest];
  let closure: { index: number; step: PreparedStep } | undefined;
  function prepareRetrace(step: FoldStep): PreparedStep {
    const { id, durationMs, turns, field, regions, crimps, guides, reopenTo } = step;
    requireValue(reopenTo !== undefined, "Missing retrace fraction");
    requireValue(
      version === 4 &&
        !turns.length &&
        !field &&
        !regions &&
        !crimps &&
        !guides &&
        closure &&
        closure.index === poses.length - 2 &&
        closure.step.charts &&
        closure.step.chartOwners &&
        Number.isFinite(reopenTo) &&
        reopenTo >= 0 &&
        reopenTo < 1,
      "Invalid reopening of a coupled action",
    );
    const source = closure.step.charts,
      owners = closure.step.chartOwners;
    const charts = source.map((chart) => {
      const end = chart(1),
        z = chartPoint(end, [0, 0, 1], true);
      const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const origin: Point = [-dot(end.x, end.origin), -dot(end.y, end.origin), -dot(z, end.origin)];
      return (p: number): Chart => {
        const c = chart(1 - (1 - reopenTo) * p);
        const axis = (i: 0 | 1) => chartPoint(c, [end.x[i], end.y[i], z[i]], true);
        return { origin: chartPoint(c, origin), x: axis(0), y: axis(1), ply: 0 };
      };
    });
    const flat = atIndex(poses, closure.index),
      dest = source.map((c) => c(reopenTo));
    poses.push(flat.map((p, i) => chartPoint(atIndex(dest, atIndex(owners, i)), p)));
    return {
      id,
      durationMs,
      turns: [],
      guides: closure.step.guides,
      charts,
      chartOwners: owners,
      reopenTo,
    };
  }
  function prepareFields(step: FoldStep, start: Pose): PreparedStep {
    const { id, durationMs, turns, field, regions, crimps, guides } = step;
    requireValue(
      version >= 3 && !turns.length && guides?.length && guides.every((g) => creases.has(g)),
      "Invalid coupled field or guides",
    );
    requireValue(
      crimps || start.every((p) => Math.abs(p[2]) <= tolerance),
      "Coupled field requires a flat starting packet",
    );
    const assigned = new Map<string, RigidField>();
    const spatial = new Map<string, (t: number) => Chart>();
    if (crimps) {
      requireValue(
        version === 4 && crimps.length && !field && !regions,
        "Invalid spatial packet assignment",
      );
      for (const crimp of crimps) {
        const pin = (id: string) => atIndex(start, vertex(id));
        const [o, y, s] = crimp.frame;
        const prepare = prepareCrimp(crimp, pin(o), pin(y), pin(s));
        requireValue(crimp.faces.length, "Empty crimp packet");
        for (const name of crimp.faces) {
          const face = faces[faceIds.indexOf(name)];
          requireValue(face && !spatial.has(name), "Invalid crimp packet");
          spatial.set(name, prepare(face.vertices.map((v) => atIndex(start, v))));
        }
      }
    }
    requireValue(!(field && regions), "Ambiguous field assignment");
    requireValue(
      version === 4 ||
        (field?.kind !== "hex-twist" && !regions?.some((r) => r.field.kind === "hex-twist")),
      "Hexagonal twist requires schema version 4",
    );
    for (const region of regions ?? []) {
      requireValue(region.faces.length, "Empty field region");
      for (const face of region.faces) {
        requireValue(faceIds.includes(face) && !assigned.has(face), "Invalid field packet");
        assigned.set(face, region.field);
      }
    }
    const charts = faces.map((face) => {
      const crimp = spatial.get(face.id);
      if (crimp) return crimp;
      const local = field ?? assigned.get(face.id);
      if (!local) return stationaryChart;
      let x = 0,
        y = 0;
      for (const v of face.vertices) {
        x += atIndex(start, v)[0];
        y += atIndex(start, v)[1];
      }
      return prepareChart(local, x / face.vertices.length, y / face.vertices.length);
    });
    const chartOwners = incident.map((owners) => atIndex(owners, 0));
    for (const t of [0, 0.125, 0.5, 0.875, 1]) {
      const transforms = charts.map((chart) => chart(t));
      const pose = start.map((p, v) => chartPoint(atIndex(transforms, atIndex(chartOwners, v)), p));
      for (const [i, face] of faces.entries())
        for (const v of face.vertices) {
          const other = chartPoint(atIndex(transforms, i), atIndex(start, v));
          requireValue(
            Math.hypot(...difference(other, atIndex(pose, v))) <= tolerance,
            `Moving field seam in ${id} at ${vertexIds[v]}`,
          );
        }
      if (t === 1) poses.push(pose);
    }
    const coupled = { id, durationMs, turns: [], guides, charts, chartOwners };
    closure = { index: poses.length - 2, step: coupled };
    return coupled;
  }
  function prepareTurns(step: FoldStep, start: Pose): PreparedStep {
    const { id, durationMs, turns, guides } = step;
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
    const coupled = turns.some((t) => t.corner);
    if (coupled) {
      requireValue(version >= 2, "Coupled corners require a version 2 pattern or newer");
      for (const [i, turn] of turns.entries()) {
        if (!turn.corner) continue;
        requireValue(
          turn.corner.motion === "right-gusset" && Math.abs(turn.degrees) === 90,
          "Invalid right gusset",
        );
        const carrier = rotations.find((t) => t.crease === turn.corner?.carriedBy);
        if (turn.corner.carriedBy) {
          requireValue(
            carrier &&
              Math.abs(carrier.degrees) === 90 &&
              !turns.find((t) => t.crease === carrier.crease)?.corner,
            "Invalid gusset carrier",
          );
        }
        atIndex(rotations, i).corner = { carrier };
      }
    }
    for (const [v, neighbors] of incident.entries()) {
      const owners = new Set(neighbors.map((f) => owner.get(f)));
      const point = atIndex(start, v);
      if (coupled && owners.size > 1) {
        // All incident transforms must trace the same material point. A stationary
        // neighbor owns a fixed seam. Otherwise evaluate one copy at runtime.
        const first = owners.has(undefined) ? undefined : owners.values().next().value;
        const reference = first === undefined ? undefined : atIndex(rotations, first);
        reference?.vertices.push(v);
        for (const t of [0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
          const expected = reference ? packetTransform(reference, t)(point) : point;
          for (const f of owners) {
            if (f === undefined || f === first) continue;
            const actual = packetTransform(atIndex(rotations, f), t)(point);
            requireValue(
              Math.hypot(...difference(actual, expected)) <= tolerance,
              `Moving seam in ${id} at ${vertexIds[v]}`,
            );
          }
        }
        continue;
      }
      // With independent hinges a shared vertex must lie on each incident axis.
      for (const index of owners) {
        if (index === undefined) continue;
        const turn = atIndex(rotations, index);
        if (owners.size === 1) turn.vertices.push(v);
        else
          requireValue(
            Math.hypot(...cross(turn.axis, difference(point, turn.origin))) <= tolerance,
            `Off-axis seam in ${id} at ${vertexIds[v]}`,
          );
      }
    }
    poses.push(applyTurns(start, rotations, 1));
    const activeCreases = guides ?? [...new Set(turns.map((t) => t.crease))];
    requireValue(
      activeCreases.length && activeCreases.every((c) => creases.has(c)),
      `Unknown guide in ${id}`,
    );
    return { id, durationMs, turns: rotations, guides: activeCreases };
  }
  const operations = {
    turns: prepareTurns,
    field: prepareFields,
    regions: prepareFields,
    crimps: prepareFields,
    reopenTo: prepareRetrace,
  } satisfies Record<OperationKind, (step: FoldStep, start: Pose) => PreparedStep>;
  const prepared = steps.map((step) => {
    try {
      requireValue(
        Number.isFinite(step.durationMs) && step.durationMs > 0,
        `Invalid step ${step.id} duration`,
      );
      return operations[operationKind(step)](step, atIndex(poses, poses.length - 1));
    } catch (error) {
      throw Error(
        `${lessonId}/${step.id}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  });
  return { lessonId, vertexIds, faces, edges, creases, poses, steps: prepared };
}

export function poseAt(lesson: CompiledLesson, step: number, progress: number): Pose {
  const p = clampProgress(progress);
  if (p === 0 || p === 1) return atIndex(lesson.poses, step + p);
  const action = atIndex(lesson.steps, step),
    start = atIndex(lesson.poses, step);
  if (action.charts && action.chartOwners) {
    const transforms = action.charts.map((chart) => chart(p)),
      owners = action.chartOwners;
    return start.map((v, i) => chartPoint(atIndex(transforms, atIndex(owners, i)), v));
  }
  return applyTurns(start, action.turns, p);
}
