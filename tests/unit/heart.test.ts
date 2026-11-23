import type { Point } from "../../app/fold/geometry";
import { heartFolds } from "../../app/lesson/heart";
import { heartText } from "../../app/lesson/heart.en";
import { verifyFlatLesson } from "./flat-lesson";

// Construct each physical endpoint directly from material coordinates, independent of the mesh.
function heartLandmark([x, y]: Point, stage: number): Point {
  if (stage <= 4) return [stage === 1 ? -Math.abs(x) : x, stage === 3 ? -Math.abs(y) : y, 0];
  y = Math.min(y, 1 - y);
  if (stage >= 6) y = Math.max(y, -0.5 - y);
  if (stage >= 7 && x < -y - 0.25) [x, y] = [-y - 0.25, -x - 0.25];
  if (stage >= 8 && x > y + 0.25) [x, y] = [y + 0.25, x - 0.25];
  if (stage >= 9) x = Math.max(x, -1.1 - x);
  if (stage >= 10) x = Math.min(x, 1.1 - x);
  if (stage >= 12 || (stage === 11 && x < 0)) y = Math.min(y, 1.3 - y);
  return [x, y, 0];
}
verifyFlatLesson("paper-heart", heartFolds, heartText, heartLandmark);
