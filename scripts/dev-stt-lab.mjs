import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error("npm 실행 경로를 찾을 수 없습니다. npm run dev:stt-lab로 실행하세요.");
}
const children = [
  spawn(process.execPath, [npmCli, "run", "dev:stt-lab:worker"], {
    cwd: process.cwd(),
    stdio: "inherit",
  }),
  spawn(process.execPath, [npmCli, "run", "dev:stt-lab:ui"], {
    cwd: process.cwd(),
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stopAll(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`STT Lab process exited (${code ?? signal ?? "unknown"}).`);
      stopAll(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
