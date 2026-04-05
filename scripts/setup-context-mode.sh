#!/usr/bin/env bash
set -euo pipefail

required_claude_version="1.0.33"
required_node_version="18.18.0"

version_ge() {
  local a b
  a="$1"
  b="$2"

  IFS='.' read -r -a av <<< "$a"
  IFS='.' read -r -a bv <<< "$b"

  local i max len_a len_b ai bi
  len_a=${#av[@]}
  len_b=${#bv[@]}
  max=$(( len_a > len_b ? len_a : len_b ))

  for (( i=0; i<max; i++ )); do
    ai=${av[i]:-0}
    bi=${bv[i]:-0}
    if (( ai > bi )); then
      return 0
    fi
    if (( ai < bi )); then
      return 1
    fi
  done

  return 0
}

echo "== Claude Code plugin bootstrap preflight =="

if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: claude CLI not found in PATH."
  echo "Install/update Claude Code, then rerun this script."
  exit 1
fi

raw_claude_version="$(claude --version 2>/dev/null || true)"
if [[ -z "$raw_claude_version" ]]; then
  echo "ERROR: could not read Claude Code version from 'claude --version'."
  exit 1
fi

current_claude_version="$(printf '%s' "$raw_claude_version" | rg -o '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
if [[ -z "$current_claude_version" ]]; then
  echo "ERROR: unable to parse semantic version from: $raw_claude_version"
  exit 1
fi

echo "Detected Claude Code version: $current_claude_version"

if ! version_ge "$current_claude_version" "$required_claude_version"; then
  echo "ERROR: Claude Code must be >= $required_claude_version for plugin marketplace support."
  echo "Try one of:"
  echo "  brew upgrade claude-code"
  echo "  npm update -g @anthropic-ai/claude-code"
  exit 1
fi

echo "OK: Claude Code version requirement satisfied (>= $required_claude_version)."

if command -v node >/dev/null 2>&1; then
  raw_node_version="$(node --version 2>/dev/null || true)"
  current_node_version="$(printf '%s' "$raw_node_version" | rg -o '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
  if [[ -n "$current_node_version" ]]; then
    if version_ge "$current_node_version" "$required_node_version"; then
      echo "OK: Node.js version is $current_node_version (Codex plugin requires >= $required_node_version)."
    else
      echo "WARNING: Node.js version is $current_node_version; Codex plugin docs require >= $required_node_version."
    fi
  fi
else
  echo "WARNING: node is not installed; Codex plugin setup requires Node.js >= $required_node_version."
fi

echo
cat <<'CHECKLIST'
Run this single setup block in Claude Code chat:

  /plugin marketplace add mksglu/context-mode
  /plugin install context-mode@context-mode
  /plugin marketplace add openai/codex-plugin-cc
  /plugin install codex@openai-codex
  /reload-plugins
  /context-mode:ctx-doctor
  /codex:setup

Optional diagnostics/maintenance:

  /context-mode:ctx-stats
  /context-mode:ctx-upgrade
  /codex:review --background
  /codex:status
  /codex:result
CHECKLIST
