import { LessonPage } from "../components/lesson-page";
import { airplanePattern } from "../lesson/airplane";
import { airplaneText, sheetText } from "../lesson/airplane.en";
import { airplaneInfo } from "../lessons";

export const meta = () => [{ name: "description", content: airplaneInfo.summary }];
const lesson = {
  sheet: sheetText,
  steps: airplanePattern.steps.map(({ id, durationMs }) => ({
    id,
    durationMs,
    ...airplaneText[id],
  })),
  loadScene: () => import("../lesson/airplane-scene.client").then((module) => module.mountAirplane),
};

export default function PaperAirplane() {
  return <LessonPage lesson={lesson} info={airplaneInfo} />;
}
