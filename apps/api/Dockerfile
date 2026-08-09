# ── Multi-stage build for NestJS API (R26) ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ── Deps ──
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Build ──
FROM deps AS build
COPY packages ./packages
COPY apps/api ./apps/api
COPY turbo.json ./
RUN pnpm --filter @idu/api db:generate \
  && pnpm turbo build --filter=@idu/api...

# ── Runtime ──
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 4000
# Har deploy'da migratsiyalarni qo'llaymiz (idempotent, Prisma advisory-lock) so'ng ilova
CMD ["sh", "-c", "../../node_modules/.bin/prisma migrate deploy && node dist/main.js"]
