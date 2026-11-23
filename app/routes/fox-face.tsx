import { LessonPage } from "../components/lesson-page";
import { foxFolds } from "../lesson/fox";
import { flatScene } from "../lesson/flat-player";
const loadScene = flatScene("fox-face", foxFolds);
export default function Lesson() {
  return <LessonPage model="fox-face" steps={foxFolds} loadScene={loadScene} />;
}
