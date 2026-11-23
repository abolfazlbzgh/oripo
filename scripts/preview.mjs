import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";

export function createPreviewServer() {
  const client = new URL("../build/client/", import.meta.url);
  const missing = readFileSync(new URL("404.html", client));
  return createServer(
    sirv(fileURLToPath(client), {
      single: false,
      onNoMatch(_request, response) {
        response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        response.end(missing);
      },
    }),
  );
}

if (import.meta.main) {
  createPreviewServer().listen(4173, "127.0.0.1", () => {
    console.log("Serving build/client at http://127.0.0.1:4173");
  });
}
