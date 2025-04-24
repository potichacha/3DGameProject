import { defineConfig } from "vite";

export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  server: {
    strictPort: true,
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  plugins: [
    {
      name: "custom-content-type",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (typeof req.url === "string" && req.url.endsWith(".js")) {
                res.setHeader("Content-Type", "application/javascript; charset=utf-8");
              }
          next();
        });
      }
    }
  ]
});