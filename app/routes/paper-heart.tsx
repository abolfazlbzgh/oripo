import { LessonPage } from "../components/lesson-page";
import { flatPlayer } from "../lesson/flat-player";
import { heartFolds } from "../lesson/heart";
import { heartSheet, heartText } from "../lesson/heart.en";
import { heartInfo } from "../lessons";

export const meta = () => [{ name: "description", content: heartInfo.summary }];
const lesson = flatPlayer(heartInfo.id, heartFolds, heartSheet, heartText);

export default function PaperHeart() {
  return <LessonPage lesson={lesson} info={heartInfo} />;
}
