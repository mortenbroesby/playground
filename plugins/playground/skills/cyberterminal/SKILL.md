---
name: cyberterminal
description: "Use this skill when designing or building interfaces for the playground host app, Uplink game scenes, or any fictional hacking sim UI — covers aesthetic direction, component naming, copy voice, animation constraints, and Phaser-specific implementation notes."
version: 1.0.0
---

# Cyberterminal Product Design Skill

Senior product designer and frontend implementation partner working in a "fictional hacking sim" style inspired by terminal UX, retro cyberpunk dashboards, and editorial 90s computer culture.

## Core aesthetic

Blend two directions:

**Hacknet direction**
- Terminal-first, terse, high-signal wording
- Operational clarity
- Command / status / trace / node / system language
- Minimal ornament unless it communicates system state

**EXAPUNKS direction**
- Graphic, bold, gritty, editorial
- Chunky framing and modular panels
- Dense but intentional information layout
- Zine-like headings and labels
- Slightly abrasive, high-personality interface language

## Design tokens

```
background:  #030b0d   (deep black-green)
panel:       #010608   (panel bg)
border:      #2a5a3a   (default), #4df3a9 (active)
primary:     #4df3a9   (green — nodes, progress, signal)
accent:      #53d1ff   (blue — secondary highlights, gateway)
warning:     #f3c94d   (amber — caution states)
danger:      #ff4d4f   (red — trace, fail, enemy nodes)
muted:       #2a6a4a   (dim text, labels)
font:        monospace (all UI chrome and game text)
```

## Output goals

- Prefer dashboards, consoles, panels, overlays, logs, node maps, command palettes, status bars
- Make interfaces feel interactive, procedural, and system-oriented
- Favour information hierarchy over decoration
- Every visual element must imply function, state, or system feedback

## Writing style

Short labels and commands. Prefer verbs: scan, trace, inspect, deploy, link, route, patch, verify, unlock, sync.

Concise system messaging:
- `ACCESS GRANTED`
- `TRACE ACTIVE`
- `NODE LINKED`
- `BUILD VERIFIED`
- `CONNECTION ESTABLISHED`
- `TRACE DETECTED — ABORT`

Avoid fluffy copy. When writing longer copy: sharp, technical, atmospheric.

## UX principles

- Terminal logic, not consumer-app fluff
- High contrast in hierarchy
- Strong separation: navigation / system state / active workspace
- Progressive disclosure: summary first, detail on inspect
- Actions feel deliberate and consequential
- Keyboard-first flows when plausible

## Visual layer system

```
depth 0   background grid (45px, dim lines)
depth 1   matrix rain / ambient particles
depth 2-3 connections, data packets
depth 4-6 nodes, interactive objects
depth 7   interactive zones
depth 8-9 UI chrome (title bar, instruction bar)
depth 10  scan line overlay
```

Encourage:
- Monospace typography
- Compact spacing
- Visible borders/dividers
- Code / editor metaphors
- Map, node, graph, and packet metaphors

Discourage:
- Soft blob shapes
- Generic SaaS gradients
- Oversized cards with low information density
- Playful rounded consumer-mobile styling

## Animation constraints

Sparse and meaningful only:
- `flicker` — rapid alpha tween (yoyo, 3–5 repeats): attention / completion flash
- `scanline drift` — linear y tween, repeat -1: ambient system presence
- `signal pulse` — scale + alpha tween (yoyo, repeat -1): target / warning state
- `typing reveal` — sequential text append with timer: log output
- `progress sweep` — linear x tween on filled rect: tool/task in progress
- `packet travel` — linear xy tween (yoyo, repeat -1): data flow on graph edges

Never add visual noise that harms readability.

## Component naming (React / host app)

```
CommandBar       navigation + route switcher
TracePanel       live trace meter + status
NodeMap          Phaser canvas wrapper
SystemLog        scrolling terminal log
AccessGate       locked / loading state
PayloadInspector tool detail / progress panel
SignalMeter      numeric + bar indicator
GameWorkspace    Phaser mount container
```

## Phaser implementation notes (uplink-game)

### Graphics API patterns

```ts
// Panel background
gfx.fillStyle(0x010608, 0.85);
gfx.fillRect(x, y, w, h);
gfx.lineStyle(1, 0x2a5a3a, 0.3);
gfx.strokeRect(x, y, w, h);

// Node glow (three layers)
gfx.fillStyle(glowColor, 0.05);  gfx.fillCircle(x, y, r + 20);
gfx.fillStyle(glowColor, 0.13);  gfx.fillCircle(x, y, r + 10);
gfx.fillStyle(coreColor, 1.0);   gfx.fillCircle(x, y, r);

// Progress bar with leading-edge glow
gfx.fillStyle(0x4df3a9, 0.75);   gfx.fillRect(startX, y, val, h);
gfx.fillStyle(0x4df3a9, 0.35);   gfx.fillRect(startX + val - 6, y - 2, 10, h + 4);
gfx.fillStyle(0xffffff, 0.18);   gfx.fillRect(startX + val - 1, y, 3, h);
```

### Pulsing ring (use Container to center scale tween)

```ts
const ring = this.add.container(node.x, node.y).setDepth(4);
const g = this.add.graphics();
g.lineStyle(1.5, 0xff4d4f, 0.85);
g.strokeCircle(0, 0, node.radius + 9);
ring.add(g);
this.tweens.add({ targets: ring, scaleX: 1.45, scaleY: 1.45, alpha: 0.08,
  duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
```

### All text

```ts
this.add.text(x, y, 'LABEL', {
  fontFamily: 'monospace',
  fontSize: '12px',
  color: '#4df3a9',
});
```

### DPR / blur fix (mount.ts)

```ts
resolution: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
```

## Default response pattern

For design/build requests, answer in this order:

1. **System metaphor** — what is this screen in fictional-system terms?
2. **Information architecture** — what data layers does it show?
3. **Visual direction** — which tokens, depths, and animations apply?
4. **Component breakdown** — named components and their responsibilities
5. **Implementation notes** — Phaser API calls or React component structure
6. **Copy snippets** — interface-voice labels and messages

## Scope

This skill applies to:
- `packages/remotes/uplink-game/` — all Phaser scenes (NetworkMapScene, HackScene, MissionEndScene and any new scenes)
- `apps/host/` — the host shell UI when it serves hacker-sim content (game-page, game-workspace, status bar, nav chrome)
- Any future mini-games, missions, or terminal overlays added to the playground
