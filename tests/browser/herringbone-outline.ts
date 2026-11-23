import type { Point } from "./paper-pixels";

// Measured in the ideal finished grid: a full panel edge projects to 0.45
// horizontally and rises 0.60. The trimmed end panels alternate in width.
export function mapOutline(): Point[][] {
  const rows: Point[][] = [];
  for (let r = 0; r < 5; r++) {
    const odd = r % 2,
      y = ((r - 2) * Math.sqrt(5)) / 6;
    const xs = odd
      ? [-19 / 30, -1 / 3, 7 / 60, 17 / 30, 61 / 60, 7 / 6]
      : [-0.9, -0.75, -0.3, 0.15, 0.6, 0.9];
    const zs = odd ? [0.2, 0.6, 0, 0.6, 0, 0.2] : [0.4, 0.6, 0, 0.6, 0, 0.4];
    rows.push(xs.map((x, c) => [x, y, zs[c]!] as Point));
  }
  return rows
    .slice(0, -1)
    .flatMap((row, r) =>
      row.slice(0, -1).map((p, c) => [p, row[c + 1]!, rows[r + 1]![c + 1]!, rows[r + 1]![c]!]),
    );
}
