import { defineConfig } from "vite";

export default defineConfig({
    assetsInclude: ["**/*.wasm"], // ✅ Permet à Vite de reconnaître les fichiers .wasm
    server: {
        strictPort: true,
        port: 5173,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp"
        }
    },
});