import { route, type RouteConfig } from "@react-router/dev/routes";
import { labPath } from "./navigation";
export default [
  route(":locale?", "routes/foundation.tsx"),
  route(":locale/guide/crease-notation", "routes/crease-guide.tsx"),
  route(":locale/lessons/:model", "routes/lesson.tsx"),
  route(labPath.slice(1), "routes/first-fold.tsx"),
] satisfies RouteConfig;
