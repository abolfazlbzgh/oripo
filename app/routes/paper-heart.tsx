import { LessonPage } from "../components/lesson-page";
import { heartFolds } from "../lesson/heart";
import { flatScene } from "../lesson/flat-player";
const loadScene = flatScene("paper-heart", heartFolds);
export default function Lesson() {
  return <LessonPage model="paper-heart" steps={heartFolds} loadScene={loadScene} />;
}
