import { LessonPage } from "../components/lesson-page";
import { calyxSteps } from "../lesson/calyx";
const loadScene = () => import("../lesson/calyx-scene.client").then((m) => m.mountCalyx);
export default function Lesson() {
  return <LessonPage model="pinwheel-calyx" steps={calyxSteps} loadScene={loadScene} />;
}
