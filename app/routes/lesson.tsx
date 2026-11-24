import { useMemo } from "react";
import { LessonPage } from "../components/lesson-page";
import { isModelId } from "../lessons";
import { loadPackage } from "../lesson/load-package";
import type { Route } from "./+types/lesson";

export async function loader({ params }: Route.LoaderArgs) {
  const id = params.model;
  if (!isModelId(id)) throw new Response(null, { status: 404 });
  const { pattern } = await loadPackage(id);
  return { id, steps: pattern.steps.map(({ id, durationMs }) => ({ id, durationMs })) };
}
export default function Lesson({ loaderData: { id, steps } }: Route.ComponentProps) {
  const loadScene = useMemo(
    () => () => import("../lesson/package-scene.client").then((m) => m.loadLessonMount(id)),
    [id],
  );
  return <LessonPage key={id} model={id} steps={steps} loadScene={loadScene} />;
}
