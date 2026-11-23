import type { Config } from "@react-router/dev/config";
import { prerenderPaths } from "./app/navigation";
import { writeStaticFiles } from "./scripts/static-files";

export default {
  ssr: false,
  prerender: prerenderPaths,
  routeDiscovery: { mode: "initial" },
  buildEnd: ({ reactRouterConfig }) =>
    writeStaticFiles(reactRouterConfig.buildDirectory, reactRouterConfig.appDirectory),
} satisfies Config;
