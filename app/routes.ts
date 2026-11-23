import { index, prefix, route, type RouteConfig } from "@react-router/dev/routes";
import { pages } from "./navigation";
import { site } from "./site";

export default [
  index("routes/start.tsx"),
  ...prefix(site.defaultLocale, [
    index("routes/foundation.tsx"),
    route(pages.creaseGuide, "routes/crease-guide.tsx"),
  ]),
] satisfies RouteConfig;
