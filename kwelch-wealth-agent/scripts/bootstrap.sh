#!/bin/bash
# KWELCH WEALTH AGENT — one-command installer for macOS/Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/kwelchvisualsLLC/kwelch-deal-scout/claude/kwelch-wealth-agent-o2idlz/kwelch-wealth-agent/scripts/bootstrap.sh | bash
#
# Clones the repo into ~/kwelch-deal-scout (or updates it), installs
# dependencies, creates .env.local with a generated encryption key, and
# starts the dev server at http://localhost:3000. Safe to re-run.
set -euo pipefail

REPO_URL="https://github.com/kwelchvisualsLLC/kwelch-deal-scout.git"
BRANCH="claude/kwelch-wealth-agent-o2idlz"
DEST="$HOME/kwelch-deal-scout"
APP_DIR="$DEST/kwelch-wealth-agent"

say() { printf '\n\033[1;33m▸ %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is not installed. On macOS run: xcode-select --install"
command -v node >/dev/null 2>&1 || die "Node.js is not installed. Download it from https://nodejs.org (LTS version), then re-run this command."

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 18+ required — you have $(node --version). Update at https://nodejs.org."

if [ -d "$DEST/.git" ]; then
  say "Repo already at $DEST — updating"
  git -C "$DEST" fetch origin "$BRANCH"
  git -C "$DEST" checkout "$BRANCH"
  git -C "$DEST" pull --ff-only origin "$BRANCH"
else
  say "Cloning into $DEST"
  git clone --branch "$BRANCH" "$REPO_URL" "$DEST"
fi

cd "$APP_DIR"

say "Installing dependencies (first run takes a couple of minutes)"
npm install --no-audit --no-fund

say "Creating .env.local (encryption key auto-generated)"
npm run setup

say "Starting KWELCH WEALTH AGENT at http://localhost:3000"
echo "  → To enable the AI chat, add your ANTHROPIC_API_KEY to:"
echo "    $APP_DIR/.env.local"
echo "  → Press Ctrl+C in this window to stop the app."

if command -v open >/dev/null 2>&1; then
  (sleep 4 && open http://localhost:3000) &
fi

exec npm run dev
