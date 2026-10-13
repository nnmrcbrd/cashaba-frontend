# Independent frontend Docker deployment

This repository builds Next.js only. It contains no backend image, database,
migration command or backend secret. The backend has its own deployment workflow.

`Dockerfile` builds Next.js standalone output with Node 22 and copies the public
and static assets into a nonroot runtime image. `nginx.conf` proxies to Next.js
with response buffering disabled. Docker runtime health checks request `/login`.

Copy `.env.docker.example` to `.env.docker` and set the **public** deployed API URL:

```dotenv
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

This is a build-time setting. Changing the server environment after building
does not change the browser bundle. Rebuild when changing the API URL or public
live-subscription flag. No Gemini, JWT, database or PayMongo secret belongs here.

Build from this repository only:

```bash
docker compose --env-file .env.docker -f docker-compose.yaml -f docker/docker-compose.build.yaml build
docker compose --env-file .env.docker up -d --wait
```

The base Nginx listener binds to `127.0.0.1:8081`. The TLS override publishes
80/443 and requires `fullchain.pem` and `privkey.pem` in `docker/tls/`, or the
directory specified by `TLS_CERT_DIR`. For direct public serving, add
`-f docker/docker-compose.tls.yaml`. Use a separate host/IP from the backend
if both use their own public 80/443 listeners. The frontend may instead remain
on a managed Next.js host while only the backend runs on a VPS.

The separate `.github/workflows/deploy.yaml` tests/builds the frontend, publishes
an immutable `DOCKERHUB_USERNAME/cashaba-frontend:sha-COMMIT` image on main, and
optionally deploys that frontend image. Configure these in **the frontend repo**:

- Variables: `DOCKERHUB_USERNAME`, `NEXT_PUBLIC_API_URL`, optional
  `NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED`, `DEPLOY_ENABLED`, `SSH_PORT`,
  `DEPLOY_PATH` (defaults to `/opt/casha-ba-frontend`).
- Secrets for an optional frontend VPS: `DOCKERHUB_TOKEN`, `SSH_HOST`, `SSH_USER`,
  `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` with a verified server host key.
- On that server: Docker/Compose 2.24.4+, `.env.docker`, TLS certificates and
  registry read access if the image is private. No backend environment file is copied.

Deployment stays manual unless `DEPLOY_ENABLED=true`. For a manual release,
select the workflow on main and set `deploy=true`. Pull requests never publish
or deploy. The deploy script validates Nginx/TLS before replacing containers,
uses a server lock and records `.env.images` after health checks pass. Subsequent
Compose commands should pass `--env-file .env.docker --env-file .env.images`.
