/**
 * Free a TCP port before starting the mock (Windows + Unix).
 * Usage: node scripts/free-port.mjs [port]
 * Default port: process.env.PORT || 4010
 */
import { execSync } from 'node:child_process';

const port = Number(process.argv[2] || process.env.PORT || 4010);

if (!Number.isFinite(port) || port <= 0) {
  console.error(`Invalid port: ${port}`);
  process.exit(1);
}

function uniquePids(pids) {
  return [...new Set(pids.filter((pid) => Number.isFinite(pid) && pid > 0))];
}

function pidsOnWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const pids = [];
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (Number.isFinite(pid)) pids.push(pid);
    }
    return uniquePids(pids);
  } catch {
    return [];
  }
}

function pidsOnUnix(targetPort) {
  try {
    const out = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return uniquePids(
      out
        .split(/\r?\n/)
        .map((line) => Number(line.trim()))
        .filter(Boolean)
    );
  } catch {
    return [];
  }
}

const isWindows = process.platform === 'win32';
const pids = isWindows ? pidsOnWindows(port) : pidsOnUnix(port);

if (pids.length === 0) {
  console.log(`Port ${port} already free`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    if (isWindows) {
      execSync(`taskkill /PID ${pid} /T /F`, {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    console.log(`Freed port ${port} (killed PID ${pid})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Could not kill PID ${pid}: ${message}`);
  }
}
