import { LessonPage } from "../components/lesson-page";
import { mapSteps } from "../lesson/herringbone";
const loadScene = () => import("../lesson/herringbone-scene.client").then((m) => m.mountMap);
export default function Lesson() {
  return <LessonPage model="herringbone-map" steps={mapSteps} loadScene={loadScene} />;
}
