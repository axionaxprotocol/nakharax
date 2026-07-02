#!/usr/bin/env bash
# Build and (re)start Nakharax OS Dashboard on EU VPS (217.216.109.5)
# Run from monorepo root: bash apps/os-dashboard/scripts/vps-deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DIR="${ROOT}/apps/os-dashboard"
APP_NAME="nakharax-os"
PORT="${PORT:-3030}"

echo "==> Nakharax OS deploy (root: ${ROOT})"

cd "${ROOT}"
pnpm install
pnpm --filter nakharax-os-dashboard build

STANDALONE="${APP_DIR}/.next/standalone/apps/os-dashboard"
if [[ ! -f "${STANDALONE}/server.js" ]]; then
  echo "Missing standalone server.js — check next.config output: standalone"
  exit 1
fi

cp -r "${APP_DIR}/.next/static" "${STANDALONE}/.next/static"
cp -r "${APP_DIR}/public" "${STANDALONE}/public"

export PORT
if command -v pm2 &>/dev/null; then
  pm2 delete "${APP_NAME}" 2>/dev/null || true
  pm2 start "${STANDALONE}/server.js" --name "${APP_NAME}" --cwd "${STANDALONE}"
  pm2 save
  echo "==> PM2: ${APP_NAME} on port ${PORT}"
else
  echo "PM2 not found — start manually:"
  echo "  PORT=${PORT} node ${STANDALONE}/server.js"
fi

echo "==> Done. Health: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${PORT}/"
