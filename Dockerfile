# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .
# (빌드 타임/런타임 둘 다 대비)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]  # next start
