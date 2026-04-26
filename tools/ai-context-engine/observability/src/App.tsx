import { useEffect, useMemo, useState } from "react";

import {
  type EventEnvelope,
  type HealthSnapshot,
  type ObservabilityMessage,
  decodeSocketMessage,
  fetchMsgpack,
} from "./protocol";

const HEALTH_ROUTE = "/health";
const HEALTH_VIEW_ROUTE = "/health/view";
const RECENT_ROUTE = "/recent";
const MAX_EVENTS = 60;

function healthTone(snapshot: HealthSnapshot | null): "ok" | "warn" | "error" {
  if (!snapshot) {
    return "warn";
  }
  if (snapshot.watch?.lastError) {
    return "error";
  }
  if (snapshot.staleStatus === "stale") {
    return "warn";
  }
  return "ok";
}

function EventCard({ event }: { event: EventEnvelope }) {
  return (
    <li className="event-card">
      <div className="event-meta">
        {[event.ts ?? "", event.source ?? "", event.event ?? ""]
          .filter(Boolean)
          .join(" · ")}
      </div>
      <pre>{JSON.stringify(event.data ?? event, null, 2)}</pre>
    </li>
  );
}

function HealthView({ snapshot }: { snapshot: HealthSnapshot | null }) {
  return (
    <main className="page-shell terminal-app">
      <section className="panel terminal-panel terminal-panel--quiet">
        <a className="back-link" href="/">
          ← observability
        </a>
        <h1>@astrograph health inspect</h1>
      </section>
      <section className="panel terminal-panel">
        <div className="scroll-frame terminal-scrollbars">
          <pre className="inspector-pre">{JSON.stringify(snapshot, null, 2)}</pre>
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [recent, setRecent] = useState<EventEnvelope[]>([]);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");

  const isHealthView = useMemo(
    () => window.location.pathname === HEALTH_VIEW_ROUTE,
    [],
  );

  useEffect(() => {
    let socket: WebSocket | null = null;
    let closed = false;

    async function boot() {
      const [healthSnapshot, recentPayload] = await Promise.all([
        fetchMsgpack<HealthSnapshot>(HEALTH_ROUTE),
        fetchMsgpack<{ repoRoot: string; events: EventEnvelope[] }>(RECENT_ROUTE),
      ]);

      if (closed) {
        return;
      }

      setHealth(healthSnapshot);
      setRecent(recentPayload.events);

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(
        `${protocol}://${window.location.host}/events?encoding=msgpack`,
      );
      socket.binaryType = "arraybuffer";
      socket.addEventListener("open", () => {
        setStatus("connected");
      });
      socket.addEventListener("close", () => {
        setStatus("disconnected");
      });
      socket.addEventListener("error", () => {
        setStatus("error");
      });
      socket.addEventListener("message", (message) => {
        void Promise.resolve(decodeSocketMessage(message.data)).then(
          (payload: ObservabilityMessage) => {
            if (payload.type === "snapshot") {
              setHealth(payload.snapshot);
              return;
            }
            if (payload.type === "recent") {
              setRecent(payload.events);
              return;
            }
            if (payload.type === "event") {
              setEvents((current) => [payload.event, ...current].slice(0, MAX_EVENTS));
              if (payload.event.event === "health.snapshot") {
                setHealth((payload.event.data ?? {}) as HealthSnapshot);
              }
            }
          },
        );
      });
    }

    void boot();
    const healthTimer = window.setInterval(() => {
      void fetchMsgpack<HealthSnapshot>(HEALTH_ROUTE)
        .then((snapshot) => {
          if (!closed) {
            setHealth(snapshot);
          }
        })
        .catch(() => undefined);
    }, 3000);

    return () => {
      closed = true;
      window.clearInterval(healthTimer);
      socket?.close();
    };
  }, []);

  if (isHealthView) {
    return <HealthView snapshot={health} />;
  }

  return (
    <main className="page-shell terminal-app">
      <section className="hero terminal-panel terminal-grid">
        <div className="hero-copy">
          <h1>@astrograph live observability</h1>
          <div className="meta">
            shared terminal theme, same-origin API, MessagePack transport
          </div>
        </div>
        <a className="health-badge" href={HEALTH_VIEW_ROUTE}>
          <span className={`health-dot ${healthTone(health)}`} />
          <span>Health</span>
        </a>
      </section>

      <section className="status-row terminal-panel terminal-panel--quiet">
        <div className={`status-pill ${status}`}>{status}</div>
      </section>

      <div className="columns">
        <section className="panel terminal-panel">
          <h2>Recent</h2>
          <ul className="event-list terminal-scrollbars">
            {recent.map((event, index) => (
              <EventCard event={event} key={event.id ?? `${event.event}-${index}`} />
            ))}
          </ul>
        </section>
        <section className="panel terminal-panel">
          <h2>Live Stream</h2>
          <ul className="event-list terminal-scrollbars">
            {events.map((event, index) => (
              <EventCard event={event} key={event.id ?? `${event.event}-${index}`} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
