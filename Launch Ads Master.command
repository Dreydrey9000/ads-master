#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then echo 'Install Node.js 22 or newer, then reopen this launcher.'; exit 1; fi
if [ ! -d node_modules ]; then npm ci; fi
if curl --silent --fail http://127.0.0.1:3210 >/dev/null; then
  open http://127.0.0.1:3210
else
  (for attempt in {1..60}; do if curl --silent --fail http://127.0.0.1:3210 >/dev/null; then open http://127.0.0.1:3210; break; fi; sleep 1; done) &
  npm run dev -- --hostname 127.0.0.1 --port 3210
fi
