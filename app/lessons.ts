import { lessons } from "./model-index.generated";
export { lessons };
export const difficultyOrder = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof difficultyOrder)[number];
export type ModelId = (typeof lessons)[number]["id"];
export function isModelId(id: string | undefined): id is ModelId {
  return lessons.some((lesson) => lesson.id === id);
}
export function groupByDifficulty<T extends { difficulty: Difficulty }>(entries: readonly T[]) {
  return difficultyOrder
    .map((difficulty) => ({
      difficulty,
      entries: entries.filter((e) => e.difficulty === difficulty),
    }))
    .filter((g) => g.entries.length > 0);
}
