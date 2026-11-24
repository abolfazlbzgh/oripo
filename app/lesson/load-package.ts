import { packageLoaders } from "./package-loaders.generated";
import type { ModelId } from "../lessons";
import type { LessonPackage } from "./package";

export async function loadPackage(id: ModelId): Promise<LessonPackage> {
  // The offline gate checks these exact files before dev, build and publication.
  const { default: data } = await packageLoaders[id]();
  return data as unknown as LessonPackage;
}
