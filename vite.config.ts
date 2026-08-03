import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const gameInput = fileURLToPath(new URL("./index.html", import.meta.url));
const sttLabInput = fileURLToPath(new URL("./stt-lab.html", import.meta.url));

export default defineConfig(({ mode }) => {
  const isQaPreview = mode === "qa";

  return {
    base: "/the-judge-became-a-magical-girl/",
    plugins: isQaPreview
      ? [
          {
            name: "qa-preview-noindex",
            transformIndexHtml: {
              order: "pre",
              handler: () => [
                {
                  tag: "meta",
                  attrs: { name: "robots", content: "noindex,nofollow" },
                  injectTo: "head",
                },
              ],
            },
          },
        ]
      : [],
    build: {
      rollupOptions: {
        input: isQaPreview
          ? gameInput
          : {
              game: gameInput,
              sttLab: sttLabInput,
            },
      },
    },
  };
});
