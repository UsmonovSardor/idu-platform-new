# IDU Platform v2

Universitet boshqaruv tizimi — **modular monolith**, noldan qayta qurilgan (full rebuild).
Backend `NestJS + Prisma + PostgreSQL`, web `Next.js 14`, mobil `React Native + Expo`, hamda Telegram Mini App.

> To'liq spetsifikatsiya: [`docs/TZ.md`](docs/TZ.md) — yagona haqiqat manbai (single source of truth).

## Arxitektura

```
Clients (Native · Web/PWA · Telegram Mini App)
        │
        ▼
  Shared packages (types · validation · api-client · design-tokens)
        │
        ▼
   NestJS API  (REST /api/v1 + WebSocket)
        │
        ▼
 PostgreSQL · Redis · S3 (MinIO)
```

### Monorepo (Turborepo + pnpm)

| Path | Nima |
|------|------|
| `apps/api` | NestJS backend — REST + WebSocket + BullMQ jobs |
| `apps/web` | Next.js 14 — web, PWA va Telegram Mini App (bitta kod) |
| `apps/mobile` | React Native + Expo — iOS/Android |
| `packages/types` | Umumiy TypeScript tiplar va enumlar |
| `packages/validation` | Zod sxemalar (api + web + mobile ulashadi) |
| `packages/api-client` | Type-safe API klient |
| `packages/design-tokens` | Ranglar / tipografiya / spacing (web + mobile) |
| `packages/config` | ESLint / TSConfig / Prettier presetlar |

## Boshlash

Talablar: **Node ≥ 20**, **pnpm ≥ 9**, **Docker**.

```bash
# 1. Bog'liqliklarni o'rnatish
pnpm install

# 2. Env
cp .env.example .env

# 3. Infratuzilma (Postgres + Redis + MinIO)
pnpm docker:up

# 4. DB migratsiya + seed
pnpm db:migrate
pnpm db:seed

# 5. Ishga tushirish (barcha applar)
pnpm dev
```

- API: <http://localhost:4000/api/v1>
- Swagger: <http://localhost:4000/api/docs>
- Web: <http://localhost:3000>
- MinIO console: <http://localhost:9001>

## Skriptlar

| Buyruq | Tavsif |
|--------|--------|
| `pnpm dev` | Barcha appларни dev rejimda ishga tushirish |
| `pnpm build` | Barchasini build qilish |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript strict tekshiruv |
| `pnpm test` | Unit + integration testlar |
| `pnpm db:migrate` | Prisma migratsiya |
| `pnpm db:studio` | Prisma Studio |

## Yo'l xaritasi (roadmap)

| Faza | Mazmun |
|------|--------|
| **0** — Poydevor | Monorepo, CI/CD, Docker, auth + RBAC, akademik struktura |
| **1** — O'quv yadrosi | Baholash, jadval, davomat, topshiriqlar |
| **2** — Imtihon | Savollar banki, test, proctoring |
| **3** — Ma'muriy | To'lov, qabul, hujjatlar, analitika |
| **4** — Aloqa | Chat, forum, e'lon, bildirishnoma, Telegram |
| **5** — Mobil | Native ilova (Expo): offline, push, store reliz |
| **6** — Kengaytma | Gamifikatsiya, AI modullari |

## Litsenziya

Ichki foydalanish uchun (proprietary). © IDU.
