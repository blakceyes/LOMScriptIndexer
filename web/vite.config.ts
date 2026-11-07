import { createReadStream, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const docs = resolve(root, "..", "docs");

const docsData = (): Plugin => ({
  name: "scriptindexer-docs-data",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || "").split("?")[0];
      if (!url.startsWith("/data/")) {
        next();
        return;
      }
      const file = join(docs, decodeURIComponent(url));
      if (!file.startsWith(docs) || !existsSync(file) || !statSync(file).isFile()) {
        next();
        return;
      }
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      createReadStream(file).pipe(res);
    });
  },
});

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "pinia"],
      dirs: ["src/stores"],
      dts: "src/auto-imports.d.ts",
      vueTemplate: true,
    }),
    Components({
      dirs: ["src/components"],
      deep: true,
      dts: "src/components.d.ts",
    }),
    docsData(),
  ],
  build: {
    outDir: docs,
    emptyOutDir: false,
    target: "baseline-widely-available",
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
