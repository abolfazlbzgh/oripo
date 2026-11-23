import { LessonPage } from "../components/lesson-page";
import { masuSteps } from "../lesson/masu";
const loadScene = () => import("../lesson/masu-scene.client").then((m) => m.mountMasu);
export default function Lesson() {
  return <LessonPage model="masu-box" steps={masuSteps} loadScene={loadScene} />;
}
