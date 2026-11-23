import { deflateSync, crc32 } from "node:zlib";
import { atIndex, type CompiledLesson } from "../app/lesson/geometry";
import { paperLayers, type HingePlies } from "../app/lesson/drawing";
import type { Point } from "../app/fold/geometry";
import type { PaperPalette } from "../app/lesson/paper-palette";

// Orthographic, depth-tested projection of the production endpoint, sampled twice per axis.
export function projectPaper(
  model: CompiledLesson,
  heights: HingePlies,
  palette: PaperPalette,
  eye: Point,
  plyThickness?: number,
) {
  const width = 440,
    height = 312,
    scale = 2,
    w = width * scale,
    h = height * scale;
  const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: Point, b: Point): Point => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (a: Point): Point => {
    const length = Math.hypot(...a);
    return [a[0] / length, a[1] / length, a[2] / length];
  };
  const toward = unit(eye),
    right = unit(cross([0, 0, 1], toward)),
    up = cross(toward, right);
  const pose = atIndex(model.poses, model.steps.length);
  const { offsets, outlines } = paperLayers(model, heights, plyThickness);
  const separation = atIndex(offsets, model.steps.length);
  const projected = model.faces.map(({ vertices }, f) =>
    vertices.map((v): Point => {
      const p = atIndex(pose, v),
        delta = atIndex(separation, f);
      const point: Point = [p[0] + delta[0], p[1] + delta[1], p[2] + delta[2]];
      return [dot(point, right), -dot(point, up), dot(point, toward)];
    }),
  );
  const xs = projected.flat().map((p) => p[0]),
    ys = projected.flat().map((p) => p[1]);
  const left = Math.min(...xs),
    top = Math.min(...ys),
    spanX = Math.max(...xs) - left,
    spanY = Math.max(...ys) - top;
  const fit = 0.91 * Math.min(w / spanX, h / spanY);
  const polygons = projected.map((face) =>
    face.map(([x, y, z]): Point => [
      (x - left - spanX / 2) * fit + w / 2,
      (y - top - spanY / 2) * fit + h / 2,
      z,
    ]),
  );
  const depth = new Float64Array(w * h).fill(-Infinity),
    rgba = new Uint8Array(w * h * 4);
  const color = (hex: string, light = 1) =>
    [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * light));
  function pixel(x: number, y: number, z: number, rgb: number[]) {
    const i = y * w + x;
    if (z < atIndex(depth, i)) return;
    depth[i] = z;
    rgba.set(rgb, i * 4);
    rgba[i * 4 + 3] = 255;
  }
  function edge(a: Point, b: Point, x: number, y: number) {
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  }
  for (const polygon of polygons) {
    const a = atIndex(polygon, 0);
    for (let j = 1; j < polygon.length - 1; j++) {
      const b = atIndex(polygon, j),
        c = atIndex(polygon, j + 1),
        area = edge(a, b, c[0], c[1]);
      if (Math.abs(area) < 1e-8) continue;
      const dzdx = (((b[2] - a[2]) * (c[1] - a[1]) - (c[2] - a[2]) * (b[1] - a[1])) * fit) / area;
      const dzdy = (((b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2])) * fit) / area;
      const normal = unit([-dzdx, -dzdy, 1]),
        light = 0.78 + 0.22 * Math.max(0, dot(normal, unit([-0.45, -0.65, 1])));
      const rgb = color(area < 0 ? palette.front : palette.reverse, light);
      for (
        let y = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
        y <= Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
        y++
      )
        for (
          let x = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
          x <= Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
          x++
        ) {
          const u = edge(b, c, x + 0.5, y + 0.5) / area,
            v = edge(c, a, x + 0.5, y + 0.5) / area,
            t = 1 - u - v;
          if (Math.min(u, v, t) >= -1e-9) pixel(x, y, u * a[2] + v * b[2] + t * c[2], rgb);
        }
    }
  }
  const ink = color(palette.edge);
  for (const [f, face] of model.faces.entries()) {
    const polygon = atIndex(polygons, f);
    for (const line of atIndex(outlines, f)) {
      if (line.appearsAfter >= model.steps.length) continue;
      const a = atIndex(polygon, face.vertices.indexOf(line.a)),
        b = atIndex(polygon, face.vertices.indexOf(line.b));
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        length = dx * dx + dy * dy;
      if (length < 1e-9) continue;
      for (
        let y = Math.max(0, Math.floor(Math.min(a[1], b[1]) - 2));
        y <= Math.min(h - 1, Math.ceil(Math.max(a[1], b[1]) + 2));
        y++
      )
        for (
          let x = Math.max(0, Math.floor(Math.min(a[0], b[0]) - 2));
          x <= Math.min(w - 1, Math.ceil(Math.max(a[0], b[0]) + 2));
          x++
        ) {
          const t = Math.max(
            0,
            Math.min(1, ((x + 0.5 - a[0]) * dx + (y + 0.5 - a[1]) * dy) / length),
          );
          if (Math.hypot(x + 0.5 - a[0] - t * dx, y + 0.5 - a[1] - t * dy) < 1.6)
            pixel(x, y, a[2] + t * (b[2] - a[2]) + 1e-7, ink);
        }
    }
  }
  const result = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const dst = y * (width * 4 + 1) + 1 + x * 4;
      const samples = [0, 1, w, w + 1]
        .map((i) => (2 * y * w + 2 * x + i) * 4)
        .filter((i) => rgba[i + 3]);
      if (!samples.length) continue;
      for (let channel = 0; channel < 3; channel++)
        result[dst + channel] = Math.round(
          samples.reduce((sum, i) => sum + atIndex(rgba, i + channel), 0) / samples.length,
        );
      result[dst + 3] = Math.round((255 * samples.length) / 4);
    }
  return encodePng(width, height, result);
}

function encodePng(width: number, height: number, scanlines: Buffer) {
  function chunk(type: string, data: Buffer) {
    const body = Buffer.concat([Buffer.from(type), data]),
      head = Buffer.alloc(4),
      tail = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
