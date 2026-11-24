import { createServer } from "vite";

// Use the project's TS resolver for offline commands without starting the app or typegen.
const server = await createServer({
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true, watch: null, ws: false, hmr: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const { run } = await server.ssrLoadModule("/scripts/model-commands.ts");
  await run(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await server.close();
}
