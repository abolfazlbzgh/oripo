import { packageLoaders } from "./package-loaders.generated";
import type { ModelId } from "../lessons";
import { resolvePresentation, type AuthoredLessonPackage, type LessonPackage } from "./package";

export async function loadPackage(id: ModelId): Promise<LessonPackage> {
  // The offline gate checks these exact files before dev, build and publication.
  const { default: data } = await packageLoaders[id]();
  return resolvePresentation(data as unknown as AuthoredLessonPackage);
}
