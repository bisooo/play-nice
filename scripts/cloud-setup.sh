#!/usr/bin/env bash
# Cloud sessions only: throwaway MongoDB (single-node replica set, needed for
# Prisma transactions), deps, and schema. Safe to rerun.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${DATABASE_URL:-}" != mongodb://127.0.0.1* ]]; then
  echo "DATABASE_URL is not the local throwaway DB; refusing (hard rule 6)." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

if ! docker ps --format '{{.Names}}' | grep -qx mongo; then
  docker rm -f mongo >/dev/null 2>&1 || true
  # mirror.gcr.io: Docker Hub rate-limits the cloud's IPs
  docker run -d --name mongo -p 27017:27017 mirror.gcr.io/library/mongo:7 --replSet rs0 --bind_ip_all >/dev/null
fi
for _ in $(seq 30); do
  docker exec mongo mongosh --quiet --eval \
    'try { rs.status().ok } catch (e) { rs.initiate({_id: "rs0", members: [{_id: 0, host: "127.0.0.1:27017"}]}).ok }' \
    >/dev/null 2>&1 && break
  sleep 1
done

[ -d node_modules ] || npm ci
npx prisma db push --skip-generate
echo "Ready: npm run dev (or build + start), then open http://127.0.0.1:3000/api/dev/login"
