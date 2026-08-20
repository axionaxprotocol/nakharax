# Multi-stage Dockerfile for Nakharax Web OS Dashboard
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/sdk ./packages/sdk
COPY apps/os-dashboard ./apps/os-dashboard

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @nakharax/sdk build
RUN pnpm --filter nakharax-os-dashboard build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/os-dashboard/public ./public
COPY --from=builder /app/apps/os-dashboard/.next/standalone ./
COPY --from=builder /app/apps/os-dashboard/.next/static ./apps/os-dashboard/.next/static

EXPOSE 3000
CMD ["node", "apps/os-dashboard/server.js"]
