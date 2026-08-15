import { cpSync, createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";

const gameInput = fileURLToPath(new URL("./index.html", import.meta.url));
const sttLabInput = fileURLToPath(new URL("./stt-lab.html", import.meta.url));
const runtimeAssets = fileURLToPath(new URL("./assets/runtime", import.meta.url));

const contentTypes: Readonly<Record<string, string>> = {
  ".mp3": "audio/mpeg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function runtimeAssetsPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "runtime-assets",
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      server.watcher.add(runtimeAssets);
      server.middlewares.use((request, response, next) => {
        let pathname: string;
        try {
          pathname = decodeURIComponent((request.url ?? "").split("?", 1)[0] ?? "");
        } catch {
          next();
          return;
        }
        const basePrefix = `${config.base}assets/`;
        const relativePath = pathname.startsWith(basePrefix)
          ? pathname.slice(basePrefix.length)
          : pathname.startsWith("/assets/")
            ? pathname.slice("/assets/".length)
            : null;
        if (!relativePath || relativePath.includes("..") || relativePath.includes("\\")) {
          next();
          return;
        }
        const filePath = resolve(runtimeAssets, relativePath);
        if (
          !filePath.startsWith(`${runtimeAssets}${sep}`) ||
          !existsSync(filePath) ||
          !statSync(filePath).isFile()
        ) {
          next();
          return;
        }
        response.statusCode = 200;
        response.setHeader("Content-Type", contentTypes[extname(filePath)] ?? "application/octet-stream");
        response.setHeader("Cache-Control", "no-cache");
        createReadStream(filePath).pipe(response);
      });
    },
    closeBundle() {
      if (config.command !== "build") return;
      cpSync(runtimeAssets, resolve(config.root, config.build.outDir, "assets"), {
        recursive: true,
        force: true,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isQaPreview = mode === "qa";

  return {
    base: "/the-judge-became-a-magical-girl/",
    plugins: [
      runtimeAssetsPlugin(),
      ...(isQaPreview
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
          ] satisfies Plugin[]
        : []),
    ],
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
