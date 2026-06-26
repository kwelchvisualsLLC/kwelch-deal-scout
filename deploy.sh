#!/usr/bin/env bash
# KWelch Deal Scout — one-command deploy to GitHub Pages (no token to type).
# Usage:  bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

USER="kwelchvisualsLLC"
REPO="kwelch-deal-scout"
LIVE="https://kwelchvisualsllc.github.io/kwelch-deal-scout/"

echo "▶ 1/3  Building…"
npm run build >/dev/null

echo "▶ 2/3  Reading cached GitHub credentials…"
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | sed -n 's/^password=//p')
if [ -z "$TOKEN" ]; then echo "✗ No GitHub credential in keychain."; exit 1; fi

echo "▶ 3/3  Publishing dist/ to gh-pages…"
TMP="$(mktemp -d)"
cp -R dist/. "$TMP"/
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q && git checkout -q -b gh-pages
git -c user.email="kwelchvisuals@gmail.com" -c user.name="KWelchVisuals" add -A
git -c user.email="kwelchvisuals@gmail.com" -c user.name="KWelchVisuals" commit -q -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
GIT_TERMINAL_PROMPT=0 git push -q -f "https://$USER:$TOKEN@github.com/$USER/$REPO.git" gh-pages:gh-pages
cd - >/dev/null && rm -rf "$TMP"

echo ""
echo "✅ Deployed → $LIVE  (refreshes in ~30-60s)"
