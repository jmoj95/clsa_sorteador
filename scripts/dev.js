import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPort = Number(process.env.PORT || 3001);
const viteCli = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

const api = spawn(process.execPath, ["server.js"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

let vite;

async function waitForApi(attempt = 0) {
  try {
    const response = await fetch(`http://localhost:${apiPort}/api/raffles`);
    if (response.ok) return true;
  } catch {
    // The API is still starting.
  }

  if (attempt >= 100) {
    console.error("The API did not become ready within 10 seconds.");
    api.kill();
    process.exitCode = 1;
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  return waitForApi(attempt + 1);
}

async function start() {
  if (!(await waitForApi())) return;

  vite = spawn(process.execPath, [viteCli], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  vite.on("exit", (code) => {
    if (!api.killed) api.kill();
    if (code && process.exitCode === undefined) process.exitCode = code;
  });
}

function stop() {
  if (vite && !vite.killed) vite.kill();
  if (!api.killed) api.kill();
}

process.on("SIGINT", () => {
  stop();
  process.exit();
});

process.on("SIGTERM", () => {
  stop();
  process.exit();
});

api.on("exit", (code) => {
  if (vite && !vite.killed) vite.kill();
  if (code && process.exitCode === undefined) process.exitCode = code;
});

start();
