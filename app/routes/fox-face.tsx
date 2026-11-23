import { LessonPage } from "../components/lesson-page";
import { flatPlayer } from "../lesson/flat-player";
import { foxFolds } from "../lesson/fox";
import { foxSheet, foxText } from "../lesson/fox.en";
import { foxInfo } from "../lessons";

export const meta = () => [{ name: "description", content: foxInfo.summary }];
const lesson = flatPlayer(foxInfo.id, foxFolds, foxSheet, foxText);

export default function FoxFace() {
  return <LessonPage lesson={lesson} info={foxInfo} />;
}
