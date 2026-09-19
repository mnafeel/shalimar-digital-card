#!/bin/bash
# Secure git update: always unlock Keychain (password prompt) before commit/push.
# Usage:
#   ./scripts/git-update.sh
#   ./scripts/git-update.sh "Commit message here"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GATE="$ROOT/scripts/git-credential-keychain-gate"
chmod +x "$GATE" 2>/dev/null || true

KEYCHAIN="${HOME}/Library/Keychains/login.keychain-db"
if [[ ! -f "$KEYCHAIN" ]]; then
  KEYCHAIN="${HOME}/Library/Keychains/login.keychain"
fi

echo "→ Unlock Keychain (password required) before git update…"
security lock-keychain "$KEYCHAIN" 2>/dev/null || true
security unlock-keychain "$KEYCHAIN"

export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=credential.helper
export GIT_CONFIG_VALUE_0="$GATE"

MSG="${1:-}"
if [[ -z "$MSG" ]]; then
  MSG="Update digital card."
fi

STATUS="$(git status --porcelain)"
if [[ -n "$STATUS" ]]; then
  git add -A
  git commit -m "$MSG" || true
fi

echo "→ Pushing (Keychain gate active)…"
git push origin HEAD

echo "✓ Git update complete."
