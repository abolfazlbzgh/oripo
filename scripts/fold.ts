import { atIndex, compileSheet, tolerance, type LessonPattern } from "../app/lesson/geometry";
import type { FoldMetadata, FoldRecord, LessonPackage } from "../app/lesson/package";
import { checkShape, foldShape } from "./schema-validation";

type Sheet = LessonPattern["sheet"];
type Pair = readonly [number, number];
type FoldFile = FoldMetadata & {
  file_spec: 1.2;
  vertices_coords: Pair[];
  edges_vertices: Pair[];
  faces_vertices: number[][];
  edges_assignment?: FoldRecord["assignments"];
  "oripo:vertexIds"?: string[];
  "oripo:faceIds"?: string[];
  "oripo:creases"?: Record<string, Pair>;
};
export type Material = { sheet: Sheet; fold?: FoldRecord };
const edgeKey = (a: number, b: number) => (a < b ? a + "/" + b : b + "/" + a);

export function describeStock(sheet: Sheet) {
  const { rest, edges } = compileSheet(sheet);
  const rim = edges.filter((e) => e.faces.length === 1);
  const next = new Map(rim.map((e) => [e.a, e.b]));
  let v = atIndex(rim, 0).a;
  const ring: typeof rest = [];
  for (let i = 0; i < rim.length; i++) {
    const end = next.get(v);
    if (end === undefined) throw Error("Material boundary branches or has multiple rings");
    next.delete(v);
    ring.push(atIndex(rest, v));
    v = end;
  }
  if (v !== atIndex(rim, 0).a || next.size) throw Error("Open material boundary");
  const corners = ring.filter((p, i) => {
    const a = atIndex(ring, (i + ring.length - 1) % ring.length),
      b = atIndex(ring, (i + 1) % ring.length);
    const cross = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
    if (cross < -1e-10) throw Error("Unsupported concave paper boundary");
    return cross > 1e-10;
  });
  const sides = corners.map((p, i) => {
    const q = atIndex(corners, (i + 1) % corners.length);
    return [q[0] - p[0], q[1] - p[1]] as const;
  });
  const lengths = sides.map((s) => Math.hypot(...s));
  const regular = lengths.every((x) => Math.abs(x - atIndex(lengths, 0)) < tolerance);
  const angles = sides.map(([x, y], i) => {
    const [u, v] = atIndex(sides, (i + 1) % sides.length);
    return (x * u + y * v) / (Math.hypot(x, y) * Math.hypot(u, v));
  });
  let shape: LessonPackage["paper"]["shape"];
  if (corners.length === 4 && angles.every((a) => Math.abs(a) < tolerance))
    shape = regular ? "square" : "rectangle";
  else if (corners.length === 6 && regular && angles.every((a) => Math.abs(a - 0.5) < tolerance))
    shape = "hexagon";
  else throw Error("Unsupported stock outline. Expected a rectangle, square or regular hexagon.");
  const extent = (i: 0 | 1) =>
    Math.max(...rest.map((p) => p[i])) - Math.min(...rest.map((p) => p[i]));
  return { shape, span: [extent(0), extent(1)] as const };
}

export function exportFold({ sheet, fold }: Material): FoldFile {
  const { vertexIds, faceIds, faces, edges, rest } = compileSheet(sheet);
  const index = new Map(vertexIds.map((id, i) => [id, i]));
  const vertex = (id: string) => {
    const v = index.get(id);
    if (v === undefined) throw Error("Unknown FOLD vertex " + id);
    return v;
  };
  const list = fold
    ? fold.edges.map(([a, b]) => [vertex(a), vertex(b)] as const)
    : edges.map((e) => [e.a, e.b] as const);
  const expected = new Map(edges.map((e) => [edgeKey(e.a, e.b), e.faces.length]));
  const assignments = fold?.assignments;
  if (assignments && assignments.length !== list.length)
    throw Error("edges_assignment length must match edges_vertices");
  for (const [i, [a, b]] of list.entries()) {
    const key = edgeKey(a, b),
      owners = expected.get(key);
    if (!owners) throw Error(`edges_vertices/${i} duplicates an edge or is not a face edge`);
    if (assignments && (atIndex(assignments, i) === "B") !== (owners === 1))
      throw Error("edges_assignment/" + i + " conflicts with the material boundary");
    expected.delete(key);
  }
  if (expected.size) throw Error("edges_vertices omits face edges");
  const data: FoldFile = {
    file_spec: 1.2,
    ...fold?.metadata,
    vertices_coords: rest.map(([x, y]) => [x, y]),
    edges_vertices: list,
    faces_vertices: faces.map((f) => f.vertices),
    ...(assignments ? { edges_assignment: assignments } : {}),
    "oripo:vertexIds": vertexIds,
    "oripo:faceIds": faceIds,
    "oripo:creases": Object.fromEntries(
      Object.entries(sheet.creases).map(([name, [a, b]]) => [
        name,
        [vertex(a), vertex(b)] as const,
      ]),
    ),
  };
  checkShape(foldShape, data, "FOLD export");
  return data;
}

export function importFold(value: unknown): Required<Material> {
  checkShape(foldShape, value, "Unsupported or invalid FOLD 1.2 material");
  const {
    file_spec,
    vertices_coords: coords,
    edges_vertices: edges,
    faces_vertices: faces,
    edges_assignment: assignments,
    "oripo:vertexIds": ids = coords.map((_, i) => "v-" + i),
    "oripo:faceIds": names = faces.map((_, i) => "f-" + i),
    "oripo:creases": guides = {},
    ...metadata
  } = value as FoldFile;
  if (file_spec !== 1.2 || ids.length !== coords.length || names.length !== faces.length)
    throw Error("Invalid FOLD version or identifier count");
  if (new Set(ids).size !== ids.length || new Set(names).size !== names.length)
    throw Error("FOLD material IDs must be unique within each vertex or face list");
  const name = (v: number) => {
    if (v >= ids.length) throw Error("Vertex index out of range: " + v);
    return atIndex(ids, v);
  };
  const ends = ([a, b]: Pair) => [name(a), name(b)] as const;
  const sheet: Sheet = {
    vertices: Object.fromEntries(coords.map(([x, y], i) => [name(i), [x, y, 0] as const])),
    faces: faces.map((vs, i) => ({ id: atIndex(names, i), vertices: vs.map(name) })),
    creases: Object.fromEntries(Object.entries(guides).map(([k, pair]) => [k, ends(pair)])),
  };
  const fold: FoldRecord = {
    metadata,
    edges: edges.map(ends),
    ...(assignments ? { assignments } : {}),
  };
  describeStock(sheet);
  exportFold({ sheet, fold });
  return { sheet, fold };
}
