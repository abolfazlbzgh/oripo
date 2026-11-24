import { LessonPage } from "../components/lesson-page";
import { ternSteps } from "../lesson/tern";
const loadScene = () => import("../lesson/tern-scene.client").then((m) => m.mountTern);
export default function Lesson() {
  return <LessonPage model="river-tern" steps={ternSteps} loadScene={loadScene} />;
}
