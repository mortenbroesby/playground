import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const DESKTOP_NOTIFY_TITLE = 'Playground';
export const DEFAULT_LOG_PATH = path.join(os.homedir(), '.cache', 'playground-agent-hooks', 'hooks.log');

export const SECRET_PATTERNS = [
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/i,
  /\b(?:ghp_|gho_|ghs_|ghr_|github_pat_|glpat|xox[baprs]-|sk-[A-Za-z0-9]{20,})\b/i,
  /AKIA[0-9A-Z]{16}/,
  /BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY/i,
  /\b(?:mongodb|postgres|mysql|redis|amqp|smtp)(?:\+[a-z]+)?:\/\/[^:\s]+:[^@\s]+@/i,
];

export function firstNonEmpty(...values) {
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

export function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

export function getEventName(payload, fallback = 'Notification') {
  return firstNonEmpty(payload?.hook_event_name, payload?.hookEventName, payload?.type, fallback);
}

export function getToolName(payload) {
  return firstNonEmpty(payload?.tool_name, payload?.toolName, payload?.tool, '');
}

export function getToolInput(payload) {
  return payload?.tool_input ?? payload?.toolInput ?? {};
}

export function getPromptText(payload) {
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

export function redactSensitiveText(text) {
  return SECRET_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, '[REDACTED]'),
    String(text ?? ''),
  );
}

export function isLikelySecret(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(text ?? '')));
}

export function getProjectRoot(payload) {
  return path.resolve(
    firstNonEmpty(
      payload?.context?.projectDir,
      payload?.context?.project_dir,
      payload?.cwd,
      process.env.CLAUDE_PROJECT_DIR,
      process.env.CODEX_WORKSPACE,
      process.cwd(),
    ),
  );
}

export function getTouchedPaths(payload) {
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

export function getWriteContentFragments(payload) {
  const toolName = getToolName(payload);
  const toolInput = getToolInput(payload);

  if (toolName === 'Write') {
    return ensureArray(toolInput?.content).filter(Boolean);
  }

  if (toolName === 'Edit') {
    return ensureArray(toolInput?.new_string).filter(Boolean);
  }

  if (toolName === 'MultiEdit') {
    return ensureArray(toolInput?.edits)
      .map((edit) => edit?.new_string)
      .filter(Boolean);
  }

  return [];
}

export function normalizeToolPath(filePath) {
  return String(filePath ?? '').replaceAll(path.sep, '/');
}

export function resolveToolPath(projectRoot, filePath) {
  if (!filePath) {
    return '';
  }

  return path.resolve(projectRoot, filePath);
}

export function isPathInsideProject(projectRoot, filePath) {
  const resolvedPath = resolveToolPath(projectRoot, filePath);
  const relativePath = path.relative(projectRoot, resolvedPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function makeJsonOutput(data) {
  return `${JSON.stringify(data)}\n`;
}

export function preToolDeny(reason) {
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

export function userPromptBlock(reason) {
  return {
    stdout: makeJsonOutput({
      decision: 'block',
      reason,
    }),
  };
}

export function sessionContext(additionalContext) {
  return {
    stdout: makeJsonOutput({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext,
      },
      suppressOutput: true,
    }),
  };
}

export function buildRecord(payload, hookName) {
  const toolInput = getToolInput(payload);

  return {
    at: new Date().toISOString(),
    hookName,
    eventName: getEventName(payload),
    toolName: getToolName(payload),
    cwd: getProjectRoot(payload),
    sessionId: firstNonEmpty(payload?.session_id, payload?.sessionId, ''),
    transcriptPath: firstNonEmpty(payload?.transcript_path, payload?.transcriptPath, ''),
    permissionMode: firstNonEmpty(payload?.permission_mode, payload?.permissionMode, ''),
    message: redactSensitiveText(getPromptText(payload).split(/\r?\n/, 1)[0]),
    touchedPaths: getTouchedPaths(payload),
    command: redactSensitiveText(firstNonEmpty(toolInput?.command, '')),
  };
}

export async function appendLog(record) {
  const logPath = process.env.AGENT_HOOKS_LOG_PATH || DEFAULT_LOG_PATH;
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, `${JSON.stringify(record)}\n`);
  } catch {
    // Logging is observability only; policy decisions must still be returned.
  }
}

export async function readPayloadFromStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw, type: 'notify' };
  }
}

export async function maybeNotifyDesktop(title, subtitle, body) {
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

export async function runHook(hookName, handler) {
  const payload = await readPayloadFromStdin();
  if (!payload) {
    return;
  }

  await appendLog(buildRecord(payload, hookName));

  const result = await handler(payload);
  if (result?.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result?.stderr) {
    process.stderr.write(result.stderr);
  }
  if (typeof result?.exitCode === 'number') {
    process.exit(result.exitCode);
  }
}

export function isDirectEntrypoint(importMetaUrl) {
  return path.resolve(process.argv[1] ?? '') === path.resolve(new URL(importMetaUrl).pathname);
}
