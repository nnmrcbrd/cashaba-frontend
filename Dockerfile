# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Browser settings are compiled into Next.js. They contain no server secrets.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED=$NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED
RUN node -e "const u=new URL(process.env.NEXT_PUBLIC_API_URL);if(u.protocol!=='https:'||u.pathname!=='/api'||u.username||u.password||u.search||u.hash||['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw new Error('Set NEXT_PUBLIC_API_URL to the deployed HTTPS backend URL ending in /api')" \
    && npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=6s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login',{signal:AbortSignal.timeout(5000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
