import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "/the-judge-became-a-magical-girl/",
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL("./index.html", import.meta.url)),
        sttLab: fileURLToPath(new URL("./stt-lab.html", import.meta.url)),
      },
    },
  },
});
