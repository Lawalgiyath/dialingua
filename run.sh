#!/usr/bin/env bash
# Dialingua - one-command launch (macOS / Linux / Git Bash)
set -e
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Building frontend..."
cd "$root/frontend"
[ -d node_modules ] || npm install
npm run build

echo "==> Starting Dialingua API + app on http://127.0.0.1:8000"
echo "    (first translation to a Tier-1 language loads the ~2.5GB NLLB model)"
cd "$root/backend"
[ -f .env ] || { [ -f .env.example ] && cp .env.example .env; }
python main.py
