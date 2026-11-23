import { createContext, useContext, useMemo } from "react";
import { formatter, type SiteData } from "./messages";

export const SiteContext = createContext<SiteData | null>(null);
export function useI18n() {
  const data = useContext(SiteContext);
  if (!data) throw new Error("Missing localized route data");
  const format = useMemo(() => formatter(data.locale), [data.locale]);
  return { ...data, format };
}
