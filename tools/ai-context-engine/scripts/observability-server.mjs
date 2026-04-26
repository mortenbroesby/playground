#!/usr/bin/env bun

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, stat } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const EVENT_TOPIC = "ai-context-engine.events";
const STORAGE_DIRNAME = ".ai-context-engine";

function usage() {
  process.stderr.write(
    [
      "Usage:",
      "  ai-context-engine observability --repo /abs/repo [--host 127.0.0.1] [--port 4318] [--recent-limit 100] [--snapshot-interval-ms 1000]",
    ].join("\n") + "\n",
  );
}

function parseArgs(argv) {
  const args = {
    repo: "",
    host: "127.0.0.1",
    port: "4318",
    recentLimit: "100",
    snapshotIntervalMs: "1000",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for argument --${key}`);
    }

    if (key === "repo") {
      args.repo = value;
    } else if (key === "host") {
      args.host = value;
    } else if (key === "port") {
      args.port = value;
    } else if (key === "recent-limit") {
      args.recentLimit = value;
    } else if (key === "snapshot-interval-ms") {
      args.snapshotIntervalMs = value;
    }

    index += 1;
  }

  if (!args.repo) {
    throw new Error("Missing required argument --repo");
  }

  return {
    repo: args.repo,
    host: args.host,
    port: Number(args.port),
    recentLimit: Number(args.recentLimit),
    snapshotIntervalMs: Number(args.snapshotIntervalMs),
  };
}

function requirePositiveInteger(value, label, allowZero = false) {
  if (!Number.isInteger(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`${label} must be ${allowZero ? "non-negative" : "positive"}`);
  }

  return value;
}

function resolveStoragePaths(repoRoot) {
  const storageDir = path.join(repoRoot, STORAGE_DIRNAME);
  return {
    storageDir,
    eventsPath: path.join(storageDir, "events.jsonl"),
  };
}

async function resolvePort(host, port) {
  if (port !== 0) {
    return port;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address ? address.port : undefined;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        if (!resolvedPort) {
          reject(new Error("Failed to resolve an ephemeral port"));
          return;
        }
        resolve(resolvedPort);
      });
    });
  });
}

function createHealthEvent(snapshot) {
  return {
    staleStatus: snapshot.staleStatus,
    freshnessMode: snapshot.freshnessMode,
    indexedFiles: snapshot.indexedFiles,
    indexedSymbols: snapshot.indexedSymbols,
    currentFiles: snapshot.currentFiles,
    changedFiles: snapshot.changedFiles,
    missingFiles: snapshot.missingFiles,
    extraFiles: snapshot.extraFiles,
    watch: snapshot.watch,
  };
}

function buildEventEnvelope({ repoRoot, source, event, level, correlationId, data }) {
  return {
    id: randomUUID(),
    ts: new Date().toISOString(),
    repoRoot,
    source,
    event,
    level,
    correlationId,
    data: data ?? {},
  };
}

async function appendLocalEvent(eventsPath, input) {
  const envelope = buildEventEnvelope(input);
  await mkdir(path.dirname(eventsPath), { recursive: true });
  await appendFile(eventsPath, `${JSON.stringify(envelope)}\n`, "utf8");
  return envelope;
}

async function readRecentEvents(eventsPath, limit) {
  const contents = await readFile(eventsPath, "utf8").catch(() => "");
  if (contents.trim() === "") {
    return [];
  }

  return contents
    .trimEnd()
    .split("\n")
    .slice(-limit)
    .map((line) => JSON.parse(line));
}

function resolveNodeExecutable() {
  const explicit = process.env.AI_CONTEXT_ENGINE_NODE_BIN;
  if (explicit && explicit.trim() !== "") {
    return explicit;
  }

  return "node";
}

async function runDiagnostics(repoRoot) {
  const nodeExecutable = resolveNodeExecutable();
  const wrapperPath = path.join(packageRoot, "scripts", "ai-context-engine.mjs");
  const { stdout } = await execFileAsync(
    nodeExecutable,
    [wrapperPath, "cli", "diagnostics", "--repo", repoRoot],
    {
      cwd: packageRoot,
      env: process.env,
      maxBuffer: 1024 * 1024 * 4,
    },
  );

  return JSON.parse(stdout);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requirePositiveInteger(args.recentLimit, "recentLimit");
  requirePositiveInteger(args.snapshotIntervalMs, "snapshotIntervalMs");
  requirePositiveInteger(args.port, "port", true);
  const resolvedPort = await resolvePort(args.host, args.port);

  const repoRoot = path.resolve(args.repo);
  const paths = resolveStoragePaths(repoRoot);
  let recentEvents = await readRecentEvents(paths.eventsPath, args.recentLimit);
  let readOffset = await stat(paths.eventsPath).then((entry) => entry.size).catch(() => 0);
  let pendingFragment = "";
  let connectedClients = 0;
  let lastHealthSnapshotId = "";
  let tailInFlight = false;
  let healthInFlight = false;

  function pushRecentEvent(event) {
    recentEvents.push(event);
    if (recentEvents.length > args.recentLimit) {
      recentEvents = recentEvents.slice(-args.recentLimit);
    }
  }

  async function publishHealthSnapshot(server, reason) {
    if (healthInFlight) {
      return null;
    }

    healthInFlight = true;
    try {
      const snapshot = await runDiagnostics(repoRoot);
      const envelope = await appendLocalEvent(paths.eventsPath, {
        repoRoot,
        source: "health",
        event: "health.snapshot",
        level: "debug",
        data: {
          reason,
          ...createHealthEvent(snapshot),
        },
      });
      lastHealthSnapshotId = envelope.id;
      return snapshot;
    } finally {
      healthInFlight = false;
    }
  }

  async function drainEventFile(server) {
    if (tailInFlight) {
      return;
    }
    tailInFlight = true;

    try {
      const nextStat = await stat(paths.eventsPath).catch(() => null);
      if (!nextStat) {
        return;
      }

      if (nextStat.size < readOffset) {
        readOffset = 0;
        pendingFragment = "";
        recentEvents = [];
      }

      if (nextStat.size === readOffset) {
        return;
      }

      const length = nextStat.size - readOffset;
      const handle = await open(paths.eventsPath, "r");

      try {
        const buffer = Buffer.alloc(length);
        await handle.read(buffer, 0, length, readOffset);
        readOffset = nextStat.size;

        const chunk = pendingFragment + buffer.toString("utf8");
        const lines = chunk.split("\n");
        pendingFragment = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim() === "") {
            continue;
          }
          const event = JSON.parse(line);
          if (event.id === lastHealthSnapshotId) {
            lastHealthSnapshotId = "";
          }
          pushRecentEvent(event);
          server.publish(EVENT_TOPIC, JSON.stringify({ type: "event", event }));
        }
      } finally {
        await handle.close();
      }
    } finally {
      tailInFlight = false;
    }
  }

  const server = Bun.serve({
    hostname: args.host,
    port: resolvedPort,
    async fetch(req, bunServer) {
      const url = new URL(req.url);

      if (url.pathname === "/events") {
        const success = bunServer.upgrade(req, {
          data: {
            connectedAt: Date.now(),
          },
        });
        return success ? undefined : new Response("WebSocket upgrade failed", { status: 500 });
      }

      if (url.pathname === "/health") {
        try {
          const snapshot = await runDiagnostics(repoRoot);
          return Response.json(snapshot);
        } catch (error) {
          return Response.json(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          );
        }
      }

      if (url.pathname === "/recent") {
        return Response.json({
          repoRoot,
          events: recentEvents,
        });
      }

      return Response.json({
        repoRoot,
        endpoints: ["/health", "/recent", "/events"],
      });
    },
    websocket: {
      open(ws) {
        connectedClients += 1;
        ws.subscribe(EVENT_TOPIC);

        void (async () => {
          try {
            const snapshot = await runDiagnostics(repoRoot);
            ws.send(JSON.stringify({
              type: "snapshot",
              snapshot,
            }));
            ws.send(JSON.stringify({
              type: "recent",
              events: recentEvents,
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : String(error),
            }));
          }
        })();
      },
      message() {
        // Read-only channel.
      },
      close() {
        connectedClients = Math.max(0, connectedClients - 1);
      },
      error() {
        // Best-effort debug surface only.
      },
    },
  });

  process.stdout.write(`${JSON.stringify({
    host: server.hostname,
    port: server.port,
    repoRoot,
  })}\n`);

  await publishHealthSnapshot(server, "startup").catch(() => null);
  await drainEventFile(server);

  const tailInterval = setInterval(() => {
    void drainEventFile(server);
  }, 150);
  const snapshotInterval = setInterval(() => {
    if (connectedClients === 0) {
      return;
    }
    void publishHealthSnapshot(server, "interval");
  }, args.snapshotIntervalMs);

  const shutdown = () => {
    clearInterval(tailInterval);
    clearInterval(snapshotInterval);
    server.stop(true);
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
