# ── 1) 빌드 스테이지 ─────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm config set legacy-peer-deps true
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ── 2) 런타임 스테이지 ───────────────────────────────────────────
FROM node:20-bullseye-slim AS runner

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_WSS_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_WSS_URL=$NEXT_PUBLIC_API_WSS_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
USER node
WORKDIR /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
