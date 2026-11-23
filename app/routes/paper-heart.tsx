import { heartInfo } from "../lessons";
import { LessonPage } from "../components/lesson-page";
import { heartFolds } from "../lesson/heart";
import { flatScene } from "../lesson/flat-player";
const loadScene = flatScene(heartInfo.id, heartFolds, heartInfo.finishedAppearance);
export default function Lesson() {
  return <LessonPage model="paper-heart" steps={heartFolds} loadScene={loadScene} />;
}
