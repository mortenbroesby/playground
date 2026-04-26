#!/usr/bin/env bun

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, realpath, stat } from "node:fs/promises";
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
const CONFIG_FILENAME = "ai-context-engine.config.json";

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
    repo: process.cwd(),
    host: null,
    port: null,
    recentLimit: null,
    snapshotIntervalMs: null,
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

  return {
    repo: args.repo,
    host: args.host,
    port: args.port === null ? undefined : Number(args.port),
    recentLimit: args.recentLimit === null ? undefined : Number(args.recentLimit),
    snapshotIntervalMs:
      args.snapshotIntervalMs === null ? undefined : Number(args.snapshotIntervalMs),
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

async function resolveRepoRoot(repoRoot) {
  const absoluteRepoRoot = path.resolve(repoRoot);
  const resolvedRepoRoot = await realpath(absoluteRepoRoot).catch(() => absoluteRepoRoot);

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--show-toplevel"],
      {
        cwd: resolvedRepoRoot,
      },
    );
    const worktreeRoot = stdout.trim();
    return await realpath(worktreeRoot).catch(() => worktreeRoot || resolvedRepoRoot);
  } catch {
    return resolvedRepoRoot;
  }
}

async function loadRepoConfig(repoRoot) {
  const configPath = path.join(repoRoot, CONFIG_FILENAME);
  const contents = await readFile(configPath, "utf8").catch((error) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  });

  const defaults = {
    summaryStrategy: "doc-comments-first",
    observability: {
      enabled: false,
      host: "127.0.0.1",
      port: 4318,
      recentLimit: 100,
      snapshotIntervalMs: 1000,
    },
  };

  if (contents === null) {
    return {
      ...defaults,
      configPath: null,
      repoRoot,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Invalid ${CONFIG_FILENAME}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: root value must be an object`);
  }

  const observability = parsed.observability;
  if (
    observability !== undefined
    && (observability === null || typeof observability !== "object" || Array.isArray(observability))
  ) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability must be an object`);
  }

  const merged = {
    ...defaults,
    configPath,
    repoRoot,
    summaryStrategy:
      parsed.summaryStrategy === undefined
        ? defaults.summaryStrategy
        : parsed.summaryStrategy,
    observability: {
      ...defaults.observability,
      ...(observability ?? {}),
    },
  };

  if (
    merged.summaryStrategy !== "doc-comments-first"
    && merged.summaryStrategy !== "signature-only"
  ) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: summaryStrategy must be a supported value`);
  }
  if (typeof merged.observability.enabled !== "boolean") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability.enabled must be a boolean`);
  }
  if (typeof merged.observability.host !== "string" || merged.observability.host.length === 0) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability.host must be a non-empty string`);
  }
  if (!Number.isInteger(merged.observability.port) || merged.observability.port < 0) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability.port must be a non-negative integer`);
  }
  if (!Number.isInteger(merged.observability.recentLimit) || merged.observability.recentLimit <= 0) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability.recentLimit must be a positive integer`);
  }
  if (
    !Number.isInteger(merged.observability.snapshotIntervalMs)
    || merged.observability.snapshotIntervalMs <= 0
  ) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: observability.snapshotIntervalMs must be a positive integer`);
  }

  return merged;
}

function renderViewerHtml(input) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ai-context-engine observability</title>
    <style>
      :root { color-scheme: light; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      body { margin: 0; background: #f3efe6; color: #1f2937; }
      main { max-width: 1200px; margin: 0 auto; padding: 24px; display: grid; gap: 16px; }
      .hero { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #d97706; padding: 20px; border-radius: 16px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      section { background: #fffdf8; border: 1px solid #e5dcc8; border-radius: 14px; padding: 16px; box-shadow: 0 10px 30px rgba(120, 113, 108, 0.08); }
      h1, h2 { margin: 0 0 12px; font-weight: 700; }
      h1 { font-size: 22px; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #92400e; }
      pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; max-height: 420px; overflow: auto; }
      li { border: 1px solid #eadfcd; border-radius: 10px; padding: 10px; background: #fff; }
      .meta { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
      .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #111827; color: #fff; font-size: 12px; }
      .ok { background: #065f46; }
      .warn { background: #b45309; }
      .error { background: #991b1b; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>ai-context-engine live observability</h1>
        <div class="meta">repoRoot: ${escapeHtml(input.repoRoot)}</div>
        <div class="meta">config: ${escapeHtml(input.configPath ?? "none")}</div>
      </section>
      <div class="grid">
        <section>
          <h2>Health</h2>
          <pre id="health">loading...</pre>
        </section>
        <section>
          <h2>Status</h2>
          <div id="status" class="pill">connecting</div>
        </section>
      </div>
      <div class="grid">
        <section>
          <h2>Recent</h2>
          <ul id="recent"></ul>
        </section>
        <section>
          <h2>Live Stream</h2>
          <ul id="events"></ul>
        </section>
      </div>
    </main>
    <script>
      const healthNode = document.getElementById("health");
      const statusNode = document.getElementById("status");
      const recentNode = document.getElementById("recent");
      const eventsNode = document.getElementById("events");
      function renderEvent(target, payload) {
        const item = document.createElement("li");
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = [payload.ts ?? "", payload.source ?? "", payload.event ?? ""].filter(Boolean).join(" · ");
        const body = document.createElement("pre");
        body.textContent = JSON.stringify(payload.data ?? payload, null, 2);
        item.append(meta, body);
        target.prepend(item);
        while (target.children.length > 40) target.removeChild(target.lastChild);
      }
      async function refreshHealth() {
        const response = await fetch("/health");
        healthNode.textContent = JSON.stringify(await response.json(), null, 2);
      }
      async function refreshRecent() {
        const response = await fetch("/recent");
        const payload = await response.json();
        recentNode.innerHTML = "";
        for (const event of payload.events ?? []) renderEvent(recentNode, event);
      }
      function setStatus(text, className) {
        statusNode.textContent = text;
        statusNode.className = "pill " + className;
      }
      async function boot() {
        await refreshHealth();
        await refreshRecent();
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(protocol + "://" + location.host + "/events");
        socket.addEventListener("open", () => setStatus("connected", "ok"));
        socket.addEventListener("close", () => setStatus("disconnected", "warn"));
        socket.addEventListener("error", () => setStatus("error", "error"));
        socket.addEventListener("message", async (message) => {
          const raw = message.data instanceof Blob ? await message.data.text() : String(message.data);
          const payload = JSON.parse(raw);
          if (payload.type === "snapshot") {
            healthNode.textContent = JSON.stringify(payload.snapshot, null, 2);
            return;
          }
          if (payload.type === "recent") {
            recentNode.innerHTML = "";
            for (const event of payload.events ?? []) renderEvent(recentNode, event);
            return;
          }
          if (payload.type === "event" && payload.event) {
            renderEvent(eventsNode, payload.event);
            if (payload.event.event === "health.snapshot") {
              healthNode.textContent = JSON.stringify(payload.event.data, null, 2);
            }
          }
        });
        setInterval(() => void refreshHealth().catch(() => undefined), 3000);
      }
      void boot();
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
  const repoRoot = await resolveRepoRoot(args.repo);
  const repoConfig = await loadRepoConfig(repoRoot);
  const host = args.host ?? repoConfig.observability.host;
  const port = args.port ?? repoConfig.observability.port;
  const recentLimit = args.recentLimit ?? repoConfig.observability.recentLimit;
  const snapshotIntervalMs =
    args.snapshotIntervalMs ?? repoConfig.observability.snapshotIntervalMs;
  requirePositiveInteger(recentLimit, "recentLimit");
  requirePositiveInteger(snapshotIntervalMs, "snapshotIntervalMs");
  requirePositiveInteger(port, "port", true);
  const resolvedPort = await resolvePort(host, port);

  const paths = resolveStoragePaths(repoRoot);
  let recentEvents = await readRecentEvents(paths.eventsPath, recentLimit);
  let readOffset = await stat(paths.eventsPath).then((entry) => entry.size).catch(() => 0);
  let pendingFragment = "";
  let connectedClients = 0;
  let lastHealthSnapshotId = "";
  let tailInFlight = false;
  let healthInFlight = false;

  function pushRecentEvent(event) {
    recentEvents.push(event);
    if (recentEvents.length > recentLimit) {
      recentEvents = recentEvents.slice(-recentLimit);
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
    hostname: host,
    port: resolvedPort,
    async fetch(req, bunServer) {
      const url = new URL(req.url);

      if (url.pathname === "/") {
        return new Response(
          renderViewerHtml({
            repoRoot,
            configPath: repoConfig.configPath,
          }),
          {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          },
        );
      }

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
        endpoints: ["/", "/health", "/recent", "/events"],
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
  }, snapshotIntervalMs);

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
