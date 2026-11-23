import { describe, expect, it } from "vitest";
import {
  commandFold,
  foldDurationMs as duration,
  initialMotion,
  sampleFold,
} from "../../app/fold/controller";

describe("timed fold commands", () => {
  it("samples elapsed time in either direction and lands on exact endpoints after a long gap", () => {
    const forward = commandFold(initialMotion, "next", 50, false);
    expect(sampleFold(forward, 0)).toEqual({ phase: "folding", progress: 0 });
    expect(sampleFold(forward, 50 + duration / 4)).toEqual({ phase: "folding", progress: 0.25 });
    expect(sampleFold(forward, 60000)).toEqual({ phase: "folded", progress: 1 });
    const reverse = commandFold(forward, "previous", 60000, false);
    expect(sampleFold(reverse, 60000 + duration / 4)).toEqual({
      phase: "unfolding",
      progress: 0.75,
    });
    expect(sampleFold(reverse, 120000)).toEqual({ phase: "unfolded", progress: 0 });
  });

  it("reverses between frames at the sampled pose with the same angular speed", () => {
    const forward = commandFold(initialMotion, "next", 0, false);
    const reverse = commandFold(forward, "previous", duration / 2, false);
    expect(sampleFold(reverse, duration / 2)).toEqual({ phase: "unfolding", progress: 0.5 });
    const again = commandFold(reverse, "next", (duration * 3) / 4, false);
    expect(sampleFold(again, (duration * 3) / 4)).toEqual({ phase: "folding", progress: 0.25 });
    expect(sampleFold(again, duration * 1.5)).toEqual({ phase: "folded", progress: 1 });
  });

  it("keeps the time anchor on duplicate commands, including commands at rest", () => {
    let motion = commandFold(initialMotion, "next", 10, false);
    for (let i = 0; i < 100; i++) {
      expect(commandFold(motion, "next", 10 + i, false)).toBe(motion);
    }
    motion = commandFold(motion, "previous", 10, false);
    expect(sampleFold(motion, 10)).toEqual({ phase: "unfolded", progress: 0 });
    expect(commandFold(motion, "previous", 20, false)).toBe(motion);
  });

  it("restarts replay at zero mid-fold, mid-reverse and at completion", () => {
    const forward = commandFold(initialMotion, "next", 0, false);
    const reverse = commandFold(forward, "previous", duration / 2, false);
    for (const [motion, now] of [
      [forward, 200],
      [reverse, duration / 2 + 20],
      [forward, duration],
    ] as const) {
      const replay = commandFold(motion, "replay", now, false);
      expect(sampleFold(replay, now)).toEqual({ phase: "folding", progress: 0 });
      expect(sampleFold(replay, now + duration)).toEqual({ phase: "folded", progress: 1 });
    }
  });

  it("finishes immediately in reduced motion, including a preference change in flight", () => {
    const forward = commandFold(initialMotion, "next", 0, false);
    for (const command of ["next", "replay", "previous"] as const) {
      const target = command === "previous" ? 0 : 1;
      const motion = commandFold(forward, command, 75, true);
      expect(sampleFold(motion, 75)).toEqual({
        phase: target ? "folded" : "unfolded",
        progress: target,
      });
    }
  });
});
