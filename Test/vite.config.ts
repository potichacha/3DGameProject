import { defineConfig } from "vite";

export default defineConfig({
    assetsInclude: ['**/*.wasm'], // ✅ Assure que les fichiers WASM sont bien chargés
    server: {
        strictPort: true,
        port: 5173
    }
});
