#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  python -m venv .venv
fi
source .venv/bin/activate
pip install -e . -q

if [[ ! -d frontend/node_modules ]]; then
  (cd frontend && npm install)
fi

trap 'kill 0' EXIT
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000 &
(cd frontend && npm run dev)
