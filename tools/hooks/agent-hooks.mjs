#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DESKTOP_NOTIFY_TITLE = 'Playground';
const DEFAULT_LOG_PATH = path.join(os.homedir(), '.cache', 'playground-agent-hooks', 'hooks.log');

const DANGEROUS_BASH_PATTERNS = [
  {
    pattern: /\brm\s+-rf\b/i,
    reason: 'Destructive rm -rf commands are blocked.',
  },
  {
    pattern: /\bgit\s+push\s+(?:-f|--force(?:-with-lease)?)/i,
    reason: 'Force-pushes are blocked by default.',
  },
  {
    pattern: /\bsudo\b/i,
    reason: 'sudo is blocked inside agent hooks.',
  },
  {
    pattern: /\b(?:curl|wget)\b.*\|\s*(?:sh|bash)\b/i,
    reason: 'Piped shell downloads are blocked.',
  },
  {
    pattern: /\bchmod\s+-R\s+777\b/i,
    reason: 'Over-broad recursive permissions are blocked.',
  },
  {
    pattern: /\bdd\s+if=/i,
    reason: 'Raw disk writes are blocked.',
  },
];

const SECRET_PATTERNS = [
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/i,
  /\b(?:ghp|github_pat|glpat|xox[baprs]|sk-[A-Za-z0-9]{20,})\b/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i,
];

const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)\.env(?:\.[^/]+)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.ssh(\/|$)/i,
  /(^|\/)id_rsa(?:\.pub)?$/i,
  /(^|\/).*\.(?:pem|key|p12|pfx)$/i,
  /(^|\/)(?:dist|\.next|\.turbo|coverage)(\/|$)/i,
];

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    const text = String(value).trim();
    if (text) {
      return text;
    }
  }

  return '';
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function getEventName(payload) {
  return firstNonEmpty(payload?.hook_event_name, payload?.hookEventName, payload?.type, 'Notification');
}

function getToolName(payload) {
  return firstNonEmpty(payload?.tool_name, payload?.toolName, payload?.tool, '');
}

function getToolInput(payload) {
  return payload?.tool_input ?? payload?.toolInput ?? {};
}

function getPromptText(payload) {
  return firstNonEmpty(
    payload?.prompt,
    payload?.message,
    payload?.summary,
    payload?.['last-assistant-message'],
    payload?.last_assistant_message,
    payload?.raw,
    '',
  );
}

function getTouchedPaths(payload) {
  const toolInput = getToolInput(payload);
  const candidates = [
    toolInput?.file_path,
    toolInput?.path,
    toolInput?.file,
    payload?.file_path,
    payload?.path,
    ...(ensureArray(toolInput?.file_paths)),
    ...(ensureArray(toolInput?.paths)),
  ];

  return candidates
    .map((value) => firstNonEmpty(value, ''))
    .filter(Boolean);
}

function isSensitivePath(filePath) {
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isLikelySecret(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

function shouldBlockCommand(command) {
  for (const rule of DANGEROUS_BASH_PATTERNS) {
    if (rule.pattern.test(command)) {
      return rule.reason;
    }
  }

  return '';
}

function buildSessionContext(payload) {
  const cwd = firstNonEmpty(payload?.cwd, process.cwd());
  return [
    'Shared hook policy is active for this session.',
    'Use `rg` and jCodemunch for discovery, avoid ad hoc grep/find scans, and keep edits scoped.',
    'Block destructive shell commands, force-pushes, piped shell downloads, and writes to secrets or generated output.',
    `Current working directory: ${cwd}`,
    'See `AGENT_HOOKS.md` for the shared policy and runtime mapping.',
  ].join('\n');
}

function makeJsonOutput(data) {
  return `${JSON.stringify(data)}\n`;
}

async function appendLog(record) {
  const logPath = process.env.AGENT_HOOKS_LOG_PATH || DEFAULT_LOG_PATH;
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(record)}\n`);
}

async function maybeNotifyDesktop(title, subtitle, body) {
  if (process.platform !== 'darwin') {
    return;
  }

  const script = `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)} subtitle ${JSON.stringify(subtitle)}`;
  const child = spawn('osascript', ['-e', script], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function buildRecord(payload) {
  const eventName = getEventName(payload);
  const toolName = getToolName(payload);
  const toolInput = getToolInput(payload);
  const touchedPaths = getTouchedPaths(payload);

  return {
    at: new Date().toISOString(),
    eventName,
    toolName,
    cwd: firstNonEmpty(payload?.cwd, process.cwd()),
    sessionId: firstNonEmpty(payload?.session_id, payload?.sessionId, ''),
    transcriptPath: firstNonEmpty(payload?.transcript_path, payload?.transcriptPath, ''),
    permissionMode: firstNonEmpty(payload?.permission_mode, payload?.permissionMode, ''),
    message: getPromptText(payload).split(/\r?\n/, 1)[0],
    touchedPaths,
    command: firstNonEmpty(toolInput?.command, ''),
  };
}

function buildResultForEvent(payload) {
  const eventName = getEventName(payload);
  const toolName = getToolName(payload);
  const toolInput = getToolInput(payload);
  const command = firstNonEmpty(toolInput?.command, '');
  const touchedPaths = getTouchedPaths(payload);
  const promptText = getPromptText(payload);

  if (eventName === 'SessionStart') {
    return {
      stdout: makeJsonOutput({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: buildSessionContext(payload),
        },
        suppressOutput: true,
      }),
    };
  }

  if (eventName === 'UserPromptSubmit' && isLikelySecret(promptText)) {
    return {
      stdout: makeJsonOutput({
        decision: 'block',
        reason: 'Prompt appears to contain a secret or credential. Redact it before continuing.',
      }),
    };
  }

  if (eventName === 'PreToolUse' && toolName === 'Bash' && command) {
    const reason = shouldBlockCommand(command);
    if (reason) {
      return {
        stdout: makeJsonOutput({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason,
          },
          suppressOutput: true,
        }),
      };
    }
  }

  if (eventName === 'PreToolUse' && ['Edit', 'Write', 'MultiEdit'].includes(toolName) && touchedPaths.some(isSensitivePath)) {
    return {
      stdout: makeJsonOutput({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: 'Editing secrets or generated output is blocked. Move the change into a tracked source file.',
        },
        suppressOutput: true,
      }),
    };
  }

  if (eventName === 'PostToolUse' && ['Edit', 'Write', 'MultiEdit'].includes(toolName) && touchedPaths.some(isSensitivePath)) {
    return {
      stdout: makeJsonOutput({
        decision: 'block',
        reason: 'A sensitive or generated file was modified. Review the change before continuing.',
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `Sensitive path touched: ${touchedPaths.filter(isSensitivePath).join(', ')}`,
        },
      }),
    };
  }

  return {};
}

export async function handleAgentHook(payload) {
  const record = buildRecord(payload);
  const eventName = record.eventName;

  await appendLog(record);

  if (eventName === 'Notification' || eventName === 'notify' || eventName === 'notify-error') {
    const title = DESKTOP_NOTIFY_TITLE;
    const subtitle = record.cwd ? path.basename(record.cwd) || record.cwd : 'session';
    const body = record.message || 'Codex turn complete';
    await maybeNotifyDesktop(title, subtitle, body.slice(0, 140));
    return {};
  }

  return buildResultForEvent(payload);
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw, type: 'notify' };
  }

  const result = await handleAgentHook(payload);
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (typeof result.exitCode === 'number') {
    process.exit(result.exitCode);
  }
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch(async (error) => {
    const logPath = process.env.AGENT_HOOKS_LOG_PATH || DEFAULT_LOG_PATH;
    try {
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(
        logPath,
        `${JSON.stringify({
          at: new Date().toISOString(),
          eventName: 'hook-error',
          message: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
    } catch {
      // Best-effort hook runner; never block the agent on logging failures.
    }
  });
}
