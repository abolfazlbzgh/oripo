import { LessonPage } from "../components/lesson-page";
import { airplanePattern } from "../lesson/airplane";
const loadScene = () =>
  import("../lesson/airplane-scene.client").then((module) => module.mountAirplane);
export default function Lesson() {
  return <LessonPage model="paper-airplane" steps={airplanePattern.steps} loadScene={loadScene} />;
}
