#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installing ApplyPilot dependencies..."
  npm install
fi
(
  sleep 2
  if command -v open >/dev/null 2>&1; then open http://localhost:4173
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:4173
  fi
) >/dev/null 2>&1 &
echo "ApplyPilot is starting. Press Ctrl+C to stop it."
npm start
