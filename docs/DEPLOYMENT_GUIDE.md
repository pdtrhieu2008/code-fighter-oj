# CODE FIGHTER OJ — DEPLOYMENT & INFRASTRUCTURE GUIDE

## 1. Production Architecture Overview

```mermaid
graph TD
    Client[Browser / Client] -->|HTTPS| Nginx[Nginx Reverse Proxy / Cloudflare]
    Nginx -->|Port 3000| NextApp[Next.js 16 Web & API Application]
    NextApp -->|Port 5432| Postgres[(PostgreSQL 16 Database)]
    NextApp -->|Port 6379| Redis[(Redis 7 Queue & Cache)]
    NextApp -->|HTTP / Queue| JudgeWorker[Judge0 Worker Pool]
    JudgeWorker -->|Sandbox execution| Isolate[nsjail / cgroup v2 Sandbox]
```

---

## 2. Environment Variables

Create `.env.production` on the production server:

```bash
# Database
DATABASE_URL="postgresql://cf_user:SECURE_PASSWORD@postgres:5432/code_fighter_oj?schema=public&sslmode=prefer"

# Auth (NextAuth v5 / Auth.js)
AUTH_SECRET="GENERATE_USING_OPENSSL_RAND_HEX_32"
NEXTAUTH_SECRET="GENERATE_USING_OPENSSL_RAND_HEX_32"
NEXTAUTH_URL="https://judge.codefighter.vn"

# Redis
REDIS_URL="redis://:REDIS_PASSWORD@redis:6379"

# Judge0 API
JUDGE0_API_URL="http://judge0-server:2358"
JUDGE0_API_KEY="SECRET_JUDGE0_AUTH_TOKEN"

# Application Settings
NEXT_PUBLIC_APP_URL="https://judge.codefighter.vn"
NEXT_PUBLIC_APP_NAME="CODE FIGHTER OJ"
NODE_ENV="production"
```

---

## 3. Docker Compose Orchestration

File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://cf_user:cf_secret@postgres:5432/code_fighter_oj?schema=public
      - REDIS_URL=redis://redis:6379
      - AUTH_SECRET=secret_token_1234567890abcdef1234567890
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: cf_user
      POSTGRES_PASSWORD: cf_secret
      POSTGRES_DB: code_fighter_oj
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cf_user -d code_fighter_oj"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 4. Multi-Stage Dockerfile

File: `Dockerfile`

```dockerfile
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

---

## 5. Database Migration & Seeding Runbook

```bash
# 1. Apply schema migrations
pnpm prisma migrate deploy

# 2. Seed default 27 belts and initial problems
pnpm ts-node prisma/seed.ts
```
