import { route, type RouteConfig } from "@react-router/dev/routes";
import { lessons } from "./lessons";
import { labPath } from "./navigation";

export default [
  route(":locale?", "routes/foundation.tsx"),
  route(":locale/guide/crease-notation", "routes/crease-guide.tsx"),
  ...lessons.map(({ id }) => route(`:locale/lessons/${id}`, `routes/${id}.tsx`)),
  route(labPath.slice(1), "routes/first-fold.tsx"),
] satisfies RouteConfig;
