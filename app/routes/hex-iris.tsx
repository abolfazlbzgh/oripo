import { LessonPage } from "../components/lesson-page";
import { irisSteps } from "../lesson/iris";
const loadScene = () => import("../lesson/iris-scene.client").then((m) => m.mountIris);
export default function Lesson() {
  return <LessonPage model="hex-iris" steps={irisSteps} loadScene={loadScene} />;
}
