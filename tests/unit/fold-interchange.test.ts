import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import { exportFold, importFold } from "../../scripts/fold";
import { lessons } from "../../app/lessons";
import { loadPackage } from "../../app/lesson/load-package";

const creasePattern = JSON.parse(
  readFileSync(new URL("../fixtures/square.fold", import.meta.url), "utf8"),
);
it("preserves independently ordered and oriented edges, assignments, faces, units and authorship", () => {
  const material = importFold(creasePattern),
    result = exportFold(material);
  expect(material.sheet.faces[1]?.vertices).toEqual(["v-0", "v-2", "v-3"]);
  expect(material.sheet.creases).toEqual({});
  expect(result).toMatchObject(creasePattern);
  expect(exportFold(importFold(result))).toEqual(result);
});
it.each(["M", "V", "F", "U"])("preserves the interior %s assignment", (sense) => {
  const f = structuredClone(creasePattern);
  f.edges_assignment[0] = sense;
  expect(exportFold(importFold(f)).edges_assignment?.[0]).toBe(sense);
});
it.each([
  { file_spec: 1.3 },
  { file_frames: [{}] },
  { frame_parent: 0 },
  { frame_classes: ["foldedForm"] },
  { faceOrders: [[0, 1, 1]] },
  { edgeOrders: [[0, 1, 1]] },
  { edges_foldAngle: [-90, 0, 0, 0, 0] },
  { edges_assignment: ["C", "B", "B", "B", "B"] },
  { edges_assignment: ["B", "B", "B", "B", "B"] },
  { edges_assignment: ["U"] },
  {
    edges_vertices: [
      [0, 2],
      [0, 2],
      [0, 1],
      [2, 3],
      [1, 2],
    ],
  },
  {
    edges_vertices: [
      [2, 0],
      [1, 0],
      [3, 0],
    ],
  },
  {
    vertices_coords: [
      [0, 0, 1],
      [2, 0],
      [2, 2],
      [0, 2],
    ],
  },
  {
    faces_vertices: [
      [0, 2, 1],
      [0, 2, 3],
    ],
  },
  { faces_vertices: [[0, 1, 9]] },
  { "external:chart": "https://example.invalid" },
  { frame_unit: "furlongs" },
])("rejects unsupported or inconsistent FOLD information %j", (bad) =>
  expect(() => importFold({ ...creasePattern, ...bad })).toThrow(),
);
it.each(lessons.map((l) => l.id))(
  "round-trips %s material IDs, panels and directed guides without assigning fold senses",
  async (id) => {
    const {
      pattern: { sheet },
    } = await loadPackage(id);
    const f = exportFold({ sheet });
    expect(f.edges_assignment).toBeUndefined();
    expect(importFold(f).sheet).toEqual(sheet);
    expect(f).not.toHaveProperty("steps");
  },
);
