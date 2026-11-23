import { LessonPage } from "../components/lesson-page";
import { frogSteps } from "../lesson/frog";
const loadScene = () => import("../lesson/frog-scene.client").then((m) => m.mountFrog);
export default function Lesson() {
  return <LessonPage model="jumping-frog" steps={frogSteps} loadScene={loadScene} />;
}
