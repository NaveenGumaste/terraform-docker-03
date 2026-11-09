import { join } from "node:path";

const PORT = Number(Bun.env.PORT ?? 3000);
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

const publicAssets: Record<string, { file: string; contentType: string }> = {
  "/app.js": { file: "app.js", contentType: "text/javascript; charset=utf-8" },
  "/styles.css": { file: "styles.css", contentType: "text/css; charset=utf-8" },
};

function serveFile(file: string, contentType: string): Response {
  return new Response(Bun.file(join(PUBLIC_DIR, file)), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const app = {
  fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        message: "Application is running",
        runtime: "Bun",
      });
    }

    if (url.pathname === "/") {
      // Keep the small JSON response available to API clients that do not ask
      // for HTML, while browsers receive the Todo app.
      if (request.headers.get("accept")?.includes("text/html")) {
        return serveFile("index.html", "text/html; charset=utf-8");
      }

      return Response.json({
        message: "Hello from Bun CI/CD Pipeline!",
        application: "CI/CD Demo",
        runtime: "Bun",
        status: "success",
      });
    }

    const asset = publicAssets[url.pathname];
    if (asset) {
      return serveFile(asset.file, asset.contentType);
    }

    return Response.json({ message: "Route not found" }, { status: 404 });
  },
};

if (import.meta.main) {
  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
  });

  console.log(`Daymark Todo running at http://localhost:${server.port}`);
}
