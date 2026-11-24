import type { Point } from "../fold/geometry";
import type { Viewpoint } from "../fold/studio.client";
import type { Difficulty } from "../lessons";
import type { HingePlies } from "./drawing";
import type { LessonPattern } from "./geometry";
import type { PaperPalette } from "./paper-palette";

import type { CameraCues } from "./camera";

export type FoldMetadata = Partial<
  Record<
    | "file_creator"
    | "file_author"
    | "file_title"
    | "file_description"
    | "frame_author"
    | "frame_title"
    | "frame_description"
    | "frame_unit",
    string
  >
> & {
  file_classes?: ["singleModel"];
  frame_classes?: ["creasePattern"];
};
export type FoldRecord = {
  metadata: FoldMetadata;
  edges: readonly (readonly [string, string])[];
  assignments?: readonly ("B" | "M" | "V" | "F" | "U")[];
};
export type LessonPackage = {
  schemaVersion: 1;
  status: "draft" | "published";
  order: number;
  difficulty: Difficulty | null;
  category: string;
  paper: { shape: "rectangle" | "square" | "hexagon"; span: readonly [number, number] };
  finishedAppearance: PaperPalette;
  manuscript: string;
  provenance: {
    variant: string;
    reference: string;
    rights: string;
    rightsStatus: "project-authored" | "traditional" | "permission-recorded" | "unverified";
    review: {
      maker: "provisional" | "independent";
      physical: "pending" | "verified";
      language: "pending" | "verified";
      visual: "pending" | "verified";
    };
  };
  presentation: {
    view: Viewpoint;
    camera?: CameraCues;
    previewEye: Point;
    hingePlies: HingePlies;
    plyThickness?: number;
  };
  pattern: LessonPattern;
  fold?: FoldRecord;
};

export type AuthoredLessonPackage = Omit<LessonPackage, "presentation"> & {
  presentation?: Partial<LessonPackage["presentation"]>;
};

function stockView(source: AuthoredLessonPackage): Viewpoint {
  const vertices = Object.values(source.pattern.sheet.vertices);
  const middle = (axis: 0 | 1) => {
    const values = vertices.map((p) => p[axis]),
      low = Math.min(...values);
    return low + (Math.max(...values) - low) / 2;
  };
  return {
    position: [1.2, -2, 2.8],
    minDistance: 0.8,
    maxDistance: 8,
    inspectBack: true,
    materialFrame: { center: [middle(0), middle(1), 0], scale: 2 / Math.max(...source.paper.span) },
  };
}

export function resolvePresentation(source: AuthoredLessonPackage): LessonPackage {
  const p = source.presentation;
  if (p?.view && p.previewEye && p.hingePlies) return source as LessonPackage;
  let hingePlies = p?.hingePlies;
  if (!hingePlies) {
    const heights: Record<string, number> = {};
    for (const step of source.pattern.steps) {
      if (!step.turns.length) continue;
      if (step.turns.some((turn) => Math.abs(turn.degrees) === 180 || turn.corner))
        throw Error(
          step.id + " requires explicit presentation.hingePlies for a flat closure or gusset",
        );
      heights[step.id] = 0;
    }
    hingePlies = heights;
  }
  return {
    ...source,
    presentation: {
      ...p,
      view: p?.view ?? stockView(source),
      previewEye: p?.previewEye ?? [1, -2, 3],
      hingePlies,
    },
  };
}
