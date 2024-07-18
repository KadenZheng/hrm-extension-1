import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
                content: "src/content.js",
                background: "src/background.js",
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "public/[name].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
        outDir: "dist",
        assetsDir: "assets",
    },
    publicDir: resolve(__dirname, "public"),
    optimizeDeps: {
        exclude: ["chrome"],
    },
});
