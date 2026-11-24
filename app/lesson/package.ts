import type { Point } from "../fold/geometry";
import type { Viewpoint } from "../fold/studio.client";
import type { Difficulty } from "../lessons";
import type { HingePlies } from "./drawing";
import type { LessonPattern } from "./geometry";
import type { PaperPalette } from "./paper-palette";

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
    previewEye: Point;
    hingePlies: HingePlies;
    plyThickness?: number;
  };
  pattern: LessonPattern;
  fold?: FoldRecord;
};
