import type { Config } from "@react-router/dev/config";
import { publishedPaths } from "./app/navigation";

export default {
  ssr: false,
  prerender: publishedPaths,
  routeDiscovery: { mode: "initial" },
} satisfies Config;
