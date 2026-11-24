import { fixture } from "../model-fixture";
import type { LessonPattern } from "../../app/lesson/geometry";
import { describe, expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import { diamond, flatPattern, type FlatFold } from "../../app/lesson/flat-pattern";
import { atIndex, compileLesson, poseAt, tolerance } from "../../app/lesson/geometry";
import { commandLesson, initialLessonMotion, sampleLesson } from "../../app/lesson/playback";

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function verifyFlatLesson(
  id: string,
  folds: LessonPattern["steps"],
  copy: Record<string, { title: string; instruction: string; result: string }>,
  landmark: (point: Point, stage: number) => Point,
) {
  const { pattern } = fixture(id);
  const model = compileLesson(pattern);
  const rest = atIndex(model.poses, 0);
  describe(id, () => {
    it("tiles one square with an unbroken rim and one instruction per reachable endpoint", () => {
      expect(Object.keys(copy).sort()).toEqual(folds.map((f) => f.id).sort());
      expect(Object.values(copy).every((c) => c.title && c.instruction && c.result)).toBe(true);
      expect(model.poses.length).toBe(folds.length + 1);
      let area = 0,
        perimeter = 0;
      const rim = new Map<number, number>();
      for (const { a, b, faces } of model.edges) {
        if (faces.length === 1) {
          expect(rim.has(a)).toBe(false);
          rim.set(a, b);
          perimeter += distance(atIndex(rest, a), atIndex(rest, b));
        }
      }
      const start = atIndex([...rim.keys()], 0);
      let v = start;
      do {
        const end = rim.get(v);
        if (end === undefined) throw Error("Open square boundary");
        rim.delete(v);
        v = end;
      } while (v !== start);
      expect(rim.size).toBe(0);
      for (const face of model.faces) {
        for (const [i, v] of face.vertices.entries()) {
          const [x, y] = atIndex(rest, v),
            [u, t] = atIndex(rest, atIndex(face.vertices, (i + 1) % face.vertices.length));
          area += (x * t - y * u) / 2;
        }
      }
      expect(area).toBeCloseTo(2, 12);
      expect(perimeter).toBeCloseTo(4 * Math.SQRT2, 12);
    });

    it("rejects an unknown packet, invalid hinge or sense, and a missing moving panel", () => {
      const first: FlatFold = {
        id: "fold",
        durationMs: 500,
        line: [
          [0, -1],
          [0, 1],
        ],
        sense: "front",
        hingePly: 0.5,
      };
      expect(() => flatPattern(id, diamond, [{ ...first, packet: "missing-ply" }])).toThrow(
        /Unknown earlier packet/,
      );
      expect(() =>
        flatPattern(id, diamond, [
          {
            ...first,
            line: [
              [0, 0],
              [Infinity, 0],
            ],
          },
        ]),
      ).toThrow(/Invalid flat hinge/);
      expect(() =>
        flatPattern(id, diamond, [Object.assign({ ...first }, { sense: "sideways" })]),
      ).toThrow(/Invalid fold sense/);
      const broken = structuredClone(pattern);
      const turn = atIndex(atIndex(broken.steps, 0).turns, 0);
      Object.assign(turn, { faces: turn.faces.slice(1) });
      expect(() => compileLesson(broken)).toThrow(/Off-axis seam/);
    });

    it("matches independent planar landmarks at every canonical pose", () => {
      let error = 0;
      for (const [stage, pose] of model.poses.entries())
        pose.forEach((p, v) => {
          error = Math.max(error, distance(p, landmark(atIndex(rest, v), stage)));
        });
      expect(error).toBeLessThan(tolerance);
      console.info(id, "endpoints", {
        landmarkError: error,
        vertices: rest.length,
        edges: model.edges.length,
        faces: model.faces.length,
      });
    });

    it("preserves all rigid distances and current hinges through 1,001 poses per action", () => {
      let rigid = 0,
        hinge = 0,
        seam = 0;
      for (const [i, step] of model.steps.entries()) {
        const start = atIndex(model.poses, i);
        expect(poseAt(model, i, 0)).toBe(start);
        expect(poseAt(model, i, 1)).toBe(model.poses[i + 1]);
        if (i + 1 < model.steps.length) expect(poseAt(model, i, 1)).toBe(poseAt(model, i + 1, 0));
        const turn = atIndex(step.turns, 0),
          ends = model.creases.get(turn.crease);
        if (!ends) throw Error("Unregistered crease");
        const moving = new Set(turn.faces);
        const [a, b, c] = turn.axis;
        for (let n = 0; n <= 1000; n++) {
          const p = n / 1000,
            pose = poseAt(model, i, p),
            theta = ((turn.degrees * Math.PI) / 180) * p;
          const sin = Math.sin(theta),
            cos = Math.cos(theta);
          for (const v of ends)
            hinge = Math.max(hinge, distance(atIndex(pose, v), atIndex(start, v)));
          for (const [f, face] of model.faces.entries()) {
            for (const [j, v] of face.vertices.entries()) {
              const here = atIndex(pose, v),
                before = atIndex(start, v);
              for (let k = 0; k < j; k++) {
                const w = atIndex(face.vertices, k);
                rigid = Math.max(
                  rigid,
                  Math.abs(
                    distance(here, atIndex(pose, w)) - distance(atIndex(rest, v), atIndex(rest, w)),
                  ),
                );
              }
              let expected = before;
              if (moving.has(f)) {
                const [ox, oy, oz] = turn.origin,
                  x = before[0] - ox,
                  y = before[1] - oy,
                  z = before[2] - oz;
                const dot = a * x + b * y + c * z;
                expected = [
                  ox + x * cos + (b * z - c * y) * sin + a * dot * (1 - cos),
                  oy + y * cos + (c * x - a * z) * sin + b * dot * (1 - cos),
                  oz + z * cos + (a * y - b * x) * sin + c * dot * (1 - cos),
                ];
                if (here[2] * Math.sign(turn.degrees) < -tolerance || here[2] < -0.4)
                  throw Error(`Packet crossed the fixed paper or support in ${step.id}`);
              }
              seam = Math.max(seam, distance(expected, here));
            }
          }
        }
      }
      expect(Math.max(rigid, hinge, seam)).toBeLessThan(tolerance);
      console.info(id, "sampled poses", { count: folds.length * 1001, rigid, hinge, seam });
    });

    it("rewinds and resumes displayed midpoints, settles reduced motion and retraces 1,000 whole trips", () => {
      let clock = 0,
        motion = initialLessonMotion,
        drift = 0;
      const midpoints = folds.map((_, i) => poseAt(model, i, 0.5));
      for (let cycle = 0; cycle < 1000; cycle++) {
        for (const dir of ["next", "previous"] as const) {
          for (let n = 0; n < folds.length; n++) {
            const i = dir === "next" ? n : folds.length - 1 - n,
              duration = atIndex(folds, i).durationMs;
            motion = commandLesson(folds, motion, dir, clock);
            clock += duration / 2;
            const mid = sampleLesson(folds, motion, clock);
            if (mid.step !== i || mid.progress !== 0.5) throw Error("Wrong moving action");
            poseAt(model, i, mid.progress).forEach((p, v) => {
              drift = Math.max(drift, distance(p, atIndex(atIndex(midpoints, i), v)));
            });
            if (cycle === 0 && dir === "next") {
              const back = commandLesson(folds, motion, "previous", clock);
              const forward = commandLesson(folds, back, "next", clock);
              const paused = commandLesson(folds, forward, "pause", clock);
              for (const m of [back, forward, paused])
                expect(sampleLesson(folds, m, clock).progress).toBe(0.5);
              expect(sampleLesson(folds, paused, clock + duration).progress).toBe(0.5);
              const resume = commandLesson(folds, paused, "play", clock);
              expect(sampleLesson(folds, resume, clock + duration / 2).position).toBe(i + 1);
              expect(
                sampleLesson(folds, commandLesson(folds, back, "next", clock, true), clock)
                  .position,
              ).toBe(i + 1);
            }
            clock += duration / 2;
            const end = sampleLesson(folds, motion, clock);
            const target = dir === "next" ? 1 : 0;
            if (
              end.position !== i + target ||
              poseAt(model, end.step, end.progress) !== model.poses[i + target]
            )
              throw Error("Wrong canonical endpoint");
          }
        }
        if (sampleLesson(folds, motion, clock).position !== 0 || poseAt(model, 0, 0) !== rest)
          throw Error("Restoration failed");
      }
      expect(drift).toBe(0);
      console.info(id, "1000 full round trips", { drift });
    });
  });
}
