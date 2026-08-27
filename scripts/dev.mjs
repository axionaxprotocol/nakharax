import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("🚀 [NakharaX Protocol] Initializing Sovereign Dev Stack (Mock-RPC + Next.js OS Dashboard)...");

// 1. Start Mock RPC Server (Port 8545 / 8546)
const rpcProcess = spawn("node", ["services/core/ops/deploy/mock-rpc/server.js"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

// 2. Start Next.js OS Dashboard (Port 3030)
const webProcess = spawn("pnpm", ["--filter", "nakharax-os-dashboard", "dev"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  console.log("\n🛑 Gracefully shutting down NakharaX services...");
  try { rpcProcess.kill(); } catch {}
  try { webProcess.kill(); } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
