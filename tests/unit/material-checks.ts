import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import {
  atIndex,
  poseAt,
  difference,
  tolerance,
  type CompiledLesson,
} from "../../app/lesson/geometry";
import { chartPoint } from "../../app/lesson/rigid-field";
import {
  seekLesson,
  sampleLesson,
  commandLesson,
  initialLessonMotion,
} from "../../app/lesson/playback";
export const distance = (p: Point, q: Point) => Math.hypot(...difference(p, q));
/** Verify a single material disk independently of the compiler's edge builder. */
export function checkSheet(m: CompiledLesson, expectedArea: number, expectedPerimeter: number) {
  const rest = atIndex(m.poses, 0);
  const dual = m.faces.map(() => [] as number[]);
  const boundary = new Map<number, number[]>();
  const incident = new Map<string, number[]>();
  const key = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)].join("/");
  let perimeter = 0,
    area = 0;
  for (const [face, { vertices }] of m.faces.entries()) {
    const signed = vertices.reduce((total, v, j) => {
      const w = atIndex(vertices, (j + 1) % vertices.length);
      const edge = key(v, w);
      incident.set(edge, [...(incident.get(edge) ?? []), face]);
      const a = atIndex(rest, v),
        b = atIndex(rest, w);
      return total + (a[0] * b[1] - a[1] * b[0]) / 2;
    }, 0);
    expect(signed).toBeGreaterThan(0);
    area += signed;
  }
  expect(incident.size).toBe(m.edges.length);
  for (const { a, b, faces } of m.edges) {
    const edge = key(a, b);
    expect(incident.get(edge)).toEqual(faces);
    incident.delete(edge);
    if (faces.length === 1) {
      perimeter += distance(atIndex(rest, a), atIndex(rest, b));
      for (const [u, v] of [
        [a, b],
        [b, a],
      ] as const)
        boundary.set(u, [...(boundary.get(u) ?? []), v]);
    } else {
      expect(faces).toHaveLength(2);
      const i = atIndex(faces, 0),
        j = atIndex(faces, 1);
      atIndex(dual, i).push(j);
      atIndex(dual, j).push(i);
    }
  }
  function reachable(first: number, neighbors: (v: number) => readonly number[]) {
    const seen = new Set<number>(),
      todo = [first];
    while (todo.length) {
      const v = todo.pop();
      if (v === undefined || seen.has(v)) continue;
      seen.add(v);
      todo.push(...neighbors(v));
    }
    return seen.size;
  }
  expect(incident.size).toBe(0);
  expect([...boundary.values()].every((v) => v.length === 2)).toBe(true);
  expect(reachable(atIndex([...boundary.keys()], 0), (v) => boundary.get(v) ?? [])).toBe(
    boundary.size,
  );
  expect(reachable(0, (i) => atIndex(dual, i))).toBe(m.faces.length);
  expect(rest.length - m.edges.length + m.faces.length).toBe(1);
  expect(area).toBeCloseTo(expectedArea, 12);
  expect(perimeter).toBeCloseTo(expectedPerimeter, 12);
}

export function materialChecks(m: CompiledLesson) {
  const rest = atIndex(m.poses, 0);
  it(m.lessonId + " keeps every panel diagonal and connected seam throughout every action", () => {
    const pairs = m.faces.flatMap((f) =>
      f.vertices.flatMap((v, i) =>
        f.vertices
          .slice(0, i)
          .map((w) => ({ v, w, d: distance(atIndex(rest, v), atIndex(rest, w)) })),
      ),
    );
    let rigid = 0,
      seam = 0,
      hinge = 0;
    for (const [i, step] of m.steps.entries()) {
      const start = atIndex(m.poses, i);
      expect(poseAt(m, i, 0)).toBe(start);
      expect(poseAt(m, i, 1)).toBe(m.poses[i + 1]);
      if (i + 1 < m.steps.length) expect(poseAt(m, i, 1)).toBe(poseAt(m, i + 1, 0));
      let previous = start;
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        const current = poseAt(m, i, fraction);
        const travel = Math.max(...current.map((p, v) => distance(p, atIndex(previous, v))));
        expect(travel, step.id).toBeGreaterThan(10 * tolerance);
        previous = current;
      }
      for (let n = 0; n <= 1000; n++) {
        const t = n / 1000,
          p = poseAt(m, i, t);
        for (const { v, w, d } of pairs)
          rigid = Math.max(rigid, Math.abs(distance(atIndex(p, v), atIndex(p, w)) - d));
        for (const turn of step.turns) {
          const ends = m.creases.get(turn.crease);
          if (!ends) throw Error("Unknown material hinge");
          for (const v of ends) hinge = Math.max(hinge, distance(atIndex(p, v), atIndex(start, v)));
        }
        if (step.charts)
          for (const [k, f] of m.faces.entries()) {
            const chart = atIndex(step.charts, k)(t);
            for (const v of f.vertices)
              seam = Math.max(seam, distance(atIndex(p, v), chartPoint(chart, atIndex(start, v))));
          }
      }
    }
    expect(Math.max(rigid, seam, hinge)).toBeLessThan(tolerance);
    console.info(m.lessonId, {
      samples: m.steps.length * 1001,
      rigid,
      seam,
      hinge,
      faces: m.faces.length,
      edges: m.edges.length,
      vertices: rest.length,
    });
  });
  it(m.lessonId + " retraces one thousand round trips and interrupted fractional seeks", () => {
    const mids = m.steps.map((_, i) => poseAt(m, i, 0.5));
    let motion = initialLessonMotion,
      clock = 0,
      drift = 0;
    for (let cycle = 0; cycle < 1000; cycle++)
      for (const dir of ["next", "previous"] as const) {
        for (let k = 0; k < m.steps.length; k++) {
          const i = dir === "next" ? k : m.steps.length - k - 1,
            d = atIndex(m.steps, i).durationMs;
          motion = commandLesson(m.steps, motion, dir, clock);
          clock += d / 2;
          const mid = sampleLesson(m.steps, motion, clock);
          if (mid.progress !== 0.5 || mid.step !== i) throw Error("Fractional clock drift");
          poseAt(m, mid.step, mid.progress).forEach((p, v) => {
            drift = Math.max(drift, distance(p, atIndex(atIndex(mids, i), v)));
          });
          clock += d / 2;
          const end = sampleLesson(m.steps, motion, clock);
          if (poseAt(m, end.step, end.progress) !== m.poses[i + (dir === "next" ? 1 : 0)])
            throw Error("Missed endpoint");
        }
      }
    expect(drift).toBe(0);
    let seed = 13579;
    for (let k = 0; k < 25; k++) {
      seed = (48271 * seed) % 2147483647;
      const i = seed % m.steps.length,
        f = 0.15 + (seed / 2147483647) * 0.7,
        d = atIndex(m.steps, i).durationMs;
      const next = commandLesson(m.steps, seekLesson(m.steps, i + f), "next", 0);
      const back = commandLesson(m.steps, next, "previous", d / 10);
      const stop = commandLesson(m.steps, back, "pause", d / 5);
      const paused = sampleLesson(m.steps, stop, d);
      expect(paused.position).toBeCloseTo(i + f, 12);
      const resume = commandLesson(m.steps, stop, "play", d);
      expect(sampleLesson(m.steps, resume, 1.1 * d).position).toBeCloseTo(i + f + 0.1, 12);
    }
    console.info(m.lessonId, { trips: 1000, drift, seeks: 25 });
  });
}
