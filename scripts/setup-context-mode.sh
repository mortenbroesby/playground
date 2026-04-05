#!/usr/bin/env bash
set -euo pipefail

required_version="1.0.33"

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

echo "== Context Mode preflight for Claude Code =="

if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: claude CLI not found in PATH."
  echo "Install/update Claude Code before tomorrow, then rerun this script."
  exit 1
fi

raw_version="$(claude --version 2>/dev/null || true)"
if [[ -z "$raw_version" ]]; then
  echo "ERROR: could not read Claude Code version from 'claude --version'."
  exit 1
fi

current_version="$(printf '%s' "$raw_version" | rg -o '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
if [[ -z "$current_version" ]]; then
  echo "ERROR: unable to parse semantic version from: $raw_version"
  exit 1
fi

echo "Detected Claude Code version: $current_version"

if ! version_ge "$current_version" "$required_version"; then
  echo "ERROR: Claude Code must be >= $required_version for plugin marketplace support."
  echo "Try one of:"
  echo "  brew upgrade claude-code"
  echo "  npm update -g @anthropic-ai/claude-code"
  exit 1
fi

echo "OK: Version requirement satisfied (>= $required_version)."

echo
cat <<'CHECKLIST'
Tomorrow in Claude Code, run:

  /plugin marketplace add mksglu/context-mode
  /plugin install context-mode@context-mode
  /reload-plugins
  /context-mode:ctx-doctor

Optional diagnostics/maintenance:

  /context-mode:ctx-stats
  /context-mode:ctx-upgrade
CHECKLIST
