import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    {
      name: "dev-lesson-previews",
      configureServer(server) {
        let previousProjector: unknown;
        let previews = new Map<string, Buffer>();
        server.middlewares.use("/previews", async (request, response, next) => {
          try {
            const source = await server.ssrLoadModule("/scripts/lesson-previews.ts");
            if (previousProjector !== source.lessonPreviews) {
              previews = source.lessonPreviews() as Map<string, Buffer>;
              previousProjector = source.lessonPreviews;
            }
            const image = previews.get("/previews" + request.url?.split("?")[0]);
            if (!image) return next();
            response.setHeader("Content-Type", "image/png");
            response.end(image);
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
  build: { license: { fileName: "third-party-licenses.txt" } },
});
