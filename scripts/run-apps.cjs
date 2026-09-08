const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const mode = process.argv[2];
if (!["dev", "start"].includes(mode)) {
  console.error("Usage: node scripts/run-apps.cjs <dev|start>");
  process.exit(1);
}
const root = path.resolve(__dirname, "..");
const nextCli = require.resolve("next/dist/bin/next", { paths: [path.join(root, "apps/frontend")] });
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      // Only terminate the process trees started by this launcher.
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore", windowsHide: true,
      });
    } else {
      try { process.kill(-child.pid, "SIGTERM"); } catch { /* Already exited. */ }
    }
  }
  process.exit(code);
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

for (const [name, port] of [
  ["backend", process.env.BACKEND_PORT || "3001"],
  ["frontend", process.env.FRONTEND_PORT || "3000"],
]) {
  console.log(`[${name}] ${mode} on port ${port}`);
  const child = spawn(process.execPath, [nextCli, mode, "--port", port], {
    cwd: path.join(root, "apps", name),
    stdio: "inherit",
    env: process.env,
    windowsHide: true,
    detached: process.platform !== "win32",
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`[${name}] exited (${code}); stopping both applications.`);
      stop(code || 1);
    }
  });
}
