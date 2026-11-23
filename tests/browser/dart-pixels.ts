import { paperPixels } from "./paper-pixels";
import type { Page } from "@playwright/test";

type Point = [number, number, number];
type Silhouette = "sheet" | { left: number; right: number };
const nose: Point = [0, 1.5, 0];
const tail: Point = [0, -1.5, 0];
const root: Point = [0, -1.5, 0.3];
const rad = Math.PI / 180;

// Independently construct the dart's exterior from the crease dimensions. Interior
// triangles, paper buffer attributes and camera matrices from the app are never read.
function outlines(shape: Silhouette): Point[][] {
  if (shape === "sheet")
    return [
      [
        [-1, -1.5, 0],
        [1, -1.5, 0],
        [1, 1.5, 0],
        [-1, 1.5, 0],
      ],
    ];
  const beta = Math.atan(0.1);
  const polygons: Point[][] = [[nose, tail, root]];
  for (const side of [-1, 1]) {
    const angle = (side < 0 ? shape.left : shape.right) * rad;
    const wingPoint = (u: number, v: number): Point => {
      const along = v * Math.cos(beta) + u * Math.sin(beta),
        across = u * Math.cos(beta) - v * Math.sin(beta);
      return [
        side * across * Math.sin(angle),
        1.5 - along * Math.cos(beta) + across * Math.sin(beta) * Math.cos(angle),
        along * Math.sin(beta) + across * Math.cos(beta) * Math.cos(angle),
      ];
    };
    polygons.push([nose, wingPoint(1, 1 / Math.tan(Math.PI / 8)), wingPoint(1, 3), root]);
  }
  return polygons;
}

export function dartPixels(page: Page, shape: Silhouette) {
  return paperPixels(page, outlines(shape), [2.4, -3.35, 4]);
}
