FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm install drizzle-kit tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

RUN mkdir -p uploads

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]
