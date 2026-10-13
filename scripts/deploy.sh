#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

IMAGE="${1:?Pass the immutable frontend image tag}"
ROOT="${DEPLOY_PATH:-/opt/casha-ba-frontend}"
BUNDLE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
[[ "$ROOT" =~ ^/[A-Za-z0-9/_-]+$ && "$ROOT" != / ]] || { echo 'Invalid deployment path' >&2; exit 1; }
[[ "$IMAGE" =~ ^[a-z0-9][a-z0-9_./-]*:sha-[a-f0-9]{40}$ ]] || { echo 'An immutable frontend sha tag is required' >&2; exit 1; }
command -v docker >/dev/null
command -v flock >/dev/null
mkdir -p "$ROOT"
exec 9>"$ROOT/.deploy.lock"
flock -w 600 9 || { echo 'Another deployment holds the server lock' >&2; exit 1; }
[[ -f "$ROOT/.env.docker" ]] || { echo 'Configure .env.docker on the frontend server first' >&2; exit 1; }
mkdir -p "$ROOT/docker/nginx" "$ROOT/scripts"
if [[ "$BUNDLE" != "$ROOT" ]]; then
  cp "$BUNDLE/docker-compose.yaml" "$BUNDLE/nginx.conf" "$ROOT/"
  cp "$BUNDLE/docker/docker-compose.tls.yaml" "$BUNDLE/docker/nginx-tls.conf" "$ROOT/docker/"
  cp "$BUNDLE/docker/nginx/http.conf" "$BUNDLE/docker/nginx/routes.conf" "$ROOT/docker/nginx/"
  cp "$BUNDLE/scripts/deploy.sh" "$ROOT/scripts/deploy.sh"
fi
NEXT="$(mktemp "$ROOT/.env.images.next.XXXXXX")"
trap 'rm -f -- "$NEXT"' EXIT
printf 'FRONTEND_IMAGE=%s\n' "$IMAGE" > "$NEXT"
compose() {
  docker compose --project-directory "$ROOT" --env-file "$ROOT/.env.docker" --env-file "$NEXT" \
    -f "$ROOT/docker-compose.yaml" -f "$ROOT/docker/docker-compose.tls.yaml" "$@"
}
compose config --quiet
compose pull
compose run --rm --no-deps nginx nginx -t
compose up -d --no-deps --wait --wait-timeout 180 frontend
compose up -d --no-deps --force-recreate --wait --wait-timeout 60 nginx
compose exec -T nginx nginx -t
mv -f -- "$NEXT" "$ROOT/.env.images"
echo 'Frontend deployment completed; Next.js and Nginx health checks passed.'
