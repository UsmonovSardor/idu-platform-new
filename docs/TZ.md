# IDU Platform v2 — Texnik Topshiriq (TZ)

> **Holat:** 🟡 Jonli hujjat (living document) — discovery davom etmoqda
> **Versiya:** 0.1 (skelet)
> **Sana:** 2026-08-04
> **Miqyos:** Bitta universitet (single-tenant)
> **Yondashuv:** Noldan qayta qurish (full rebuild), eski `idu-platform` biznes-mantig'i asosida

---

## 0. Hujjat maqsadi

Bu hujjat — IDU Platformasining **jahon talabidagi (world-class)** yangi versiyasi uchun texnik topshiriq. Eski loyihaning kuchli tomonlari (backend biznes-mantiq, xavfsizlik asoslari, boy funksional) saqlanib, zaif tomonlari (monolit vanilla-JS frontend, hardcode domen, test yo'qligi) tubdan hal qilinadi.

**Bo'limlar holati:**
- ✅ 1. Texnologiya steki — TASDIQLANGAN
- ✅ 2. Tasdiqlangan yaxshilanishlar (R1–R40) — TASDIQLANGAN
- ✅ 3. Telegram Mini App — TASDIQLANGAN (yangi talab)
- 🟡 4. Funksional modullar — discovery kutilmoqda
- 🟡 5. Rollar & huquqlar matritsasi — discovery kutilmoqda
- 🟡 6. Ma'lumotlar modeli (ERD) — discovery kutilmoqda
- 🟡 7. Non-functional talablar — qisman (R-bloklardan)

---

## 1. Texnologiya steki (TASDIQLANGAN)

| Qatlam | Texnologiya |
|---|---|
| **Frontend (web)** | Next.js 14 (App Router) + TypeScript |
| **UI** | TailwindCSS + shadcn/ui + Design tokens |
| **Frontend state** | TanStack Query (server state) + Zustand (client state) |
| **Form/validatsiya** | react-hook-form + Zod |
| **Backend** | NestJS + TypeScript (modular monolith) |
| **ORM / DB** | Prisma + PostgreSQL |
| **Cache / real-time** | Redis + Socket.IO |
| **Background jobs** | BullMQ (Redis asosida) |
| **Fayl saqlash** | S3-uyg'un (Railway/MinIO/AWS) |
| **API doc** | OpenAPI / Swagger (auto-generated) |
| **Auth** | JWT (access+refresh, httpOnly) + RBAC (CASL) + 2FA |
| **Mini App** | Telegram Web App (TWA) + bot |
| **Monitoring** | Sentry + structured logging (pino/winston) |
| **CI/CD** | GitHub Actions + Docker |
| **Deploy** | Railway (staging + production) |

---

## 2. Tasdiqlangan yaxshilanishlar (R1–R40) — "Jahon talabi"

### A. Arxitektura
- **R1** — Next.js 14 (App Router) + TS: komponentli, SSR/SEO, xatolik kamayishi.
- **R2** — NestJS + TS, modul/DI: toza qatlamlar, testlanadigan, enterprise standart.
- **R3** — Bundler (Turbopack/Vite) + code-splitting: avtomatik optimizatsiya, kichik bundle.
- **R4** — Modular monolith: kelajakda microservice'ga bo'linadigan aniq chegaralar.
- **R5** — Bitta versiyalangan REST `/api/v1` + OpenAPI/Swagger auto-doc.

### B. Ma'lumotlar bazasi & Data layer
- **R6** — Prisma ORM + type-safe migratsiya (bitta haqiqat manbai).
- **R7** — Domen to'liq DB'da sozlanadigan: fakultet, fan, rol — hech narsa hardcode emas.
- **R8** — To'liq soft-delete + audit trail (ma'lumot yo'qolmaydi).
- **R9** — Full-text qidiruv (Postgres `pg_trgm`/`tsvector`).
- **R10** — Read-replica + connection pooling (PgBouncer) tayyorligi.

### C. UI/UX & Design system
- **R11** — Design system: Tailwind + shadcn/ui + design tokens.
- **R12** — Figma-first komponent kutubxonasi + Storybook.
- **R13** — To'liq light/dark + brend theming.
- **R14** — Accessibility WCAG 2.1 AA (klaviatura, screen-reader, kontrast).
- **R15** — Skeleton loading, optimistik UI, micro-animatsiya ("premium" his).

### D. Performance
- **R16** — Core Web Vitals maqsadi: LCP<2.5s, INP<200ms (Lighthouse CI).
- **R17** — Redis caching + API pagination hamma joyda.
- **R18** — Image optimization (Next Image, WebP/AVIF, CDN).
- **R19** — Background jobs (BullMQ): email, PDF, hisobot, import.

### E. Xavfsizlik
- **R20** — Strict CSP, inline'siz (nonce) → haqiqiy XSS himoya.
- **R21** — RBAC + fine-grained permissions (CASL), rollar matritsasi.
- **R22** — 2FA (OTP/authenticator) admin/dekanat uchun.
- **R23** — To'liq audit trail (kim, nima, qachon).
- **R24** — Rate-limit + brute-force himoya + secret'lar env/Vault.
- **R25** — Imtihon proctoring: tab-switch, copy, vaqt nazorati.

### F. DevOps / Infra / CI-CD
- **R26** — Docker + docker-compose (dev=prod parity).
- **R27** — GitHub Actions CI: lint → test → build → deploy.
- **R28** — Staging + Production muhitlari.
- **R29** — Avtomatik DB backup + restore rejasi.
- **R30** — Feature flags (yangi feature'ni sekin yoqish).

### G. Sifat & Testing
- **R31** — Unit + integration + E2E (Playwright), coverage ≥70%.
- **R32** — ESLint + Prettier + Husky pre-commit + TS strict.
- **R33** — Load testing (k6) — sessiya/imtihon peak uchun.

### H. Observability & Analitika
- **R34** — Sentry + structured logging + health/metrics endpoint.
- **R35** — Admin analitika dashboard (KPI: davomat, o'zlashtirish, to'lov).

### I. Xalqaro / kesishuvchi
- **R36** — i18n: uz / ru / en (RTL-ready).
- **R37** — PWA + mobil-first responsive (keyin native app imkoniyati).
- **R38** — Integratsiyalar: Payme/Click, Eskiz SMS, HEMIS (agar kerak), Google/email SSO.
- **R39** — AI modullari (ixtiyoriy): chat-yordamchi, savol generatsiya, baho tahlili, plagiat.
- **R40** — Real-time (Socket.IO): chat, bildirishnoma, jonli imtihon nazorati.

---

## 3. Telegram Mini App (TASDIQLANGAN — yangi talab)

**Maqsad:** Platformaga Telegram ichida ishlaydigan, **mobil ilova kabi his qiladigan** to'liq huquqli kirish nuqtasi. Talaba/o'qituvchi telefoniga alohida app o'rnatmasdan, Telegram orqali tizimdan foydalanadi.

### 3.1. Yondashuv
- **Bitta kod bazasi, ikki "shell":** Next.js frontend ham brauzer (web/PWA), ham Telegram Mini App sifatida ishlaydi. Telegram muhitida `@twa-dev/sdk` (Telegram Web App SDK) faollashadi.
- **Mini App = native app tuyg'usi:** MainButton, BackButton, haptic feedback, Telegram theme sinxroni, swipe gesture, full-screen, splash.

### 3.2. Autentifikatsiya
- Telegram `initData` orqali avtorizatsiya — backend `initData` hash'ini **bot token bilan tekshiradi** (HMAC-SHA256), soxta kirish oldi olinadi.
- Telegram akkaunti platforma foydalanuvchisiga **bog'lanadi** (birinchi kirishda login orqali, keyin avtomatik).
- Web va Mini App bir xil sessiya/JWT tizimidan foydalanadi.

### 3.3. Funksional (Mini App ichida)
- Talaba: baholar, jadval, davomat, topshiriqlar, imtihon/test, e'lonlar, chat, to'lov holati.
- O'qituvchi: jadval, davomat belgilash, baho qo'yish, topshiriq tekshirish.
- **Push o'rniga Telegram bot bildirishnomalari:** yangi baho, dars eslatmasi, e'lon, to'lov muddати — bot orqali xabar.
- Deep-linking: bot xabaridagi tugma → Mini App'ning aynan kerakli sahifasiga (`startapp` parametri).

### 3.4. Bot roli
- Bildirishnoma yuboruvchi (BullMQ queue → Telegram Bot API).
- Mini App'ni ochish tugmasi (`web_app` button / menu button).
- Ixtiyoriy: tez buyruqlar (`/baho`, `/jadval`) → Mini App'ga yo'naltirish.

### 3.5. Texnik e'tiborlar
- Telegram theme (light/dark) → app theme bilan sinxron (R13 bilan bog'liq).
- Cheklangan ekran → mobil-first dizayn (R37 bilan bog'liq).
- Xavfsizlik: `initData` har so'rovda tekshiriladi; bot token faqat backend'da.
- Telegram cloud storage'dan foydalanish (kichik sozlamalar uchun).

### 3.6. Ochiq savollar (Mini App)
- [ ] Telegram to'lovlari (Telegram Payments) kerakmi yoki faqat Payme/Click?
- [ ] Mini App barcha rollar uchunmi yoki asosan talaba/o'qituvchi?
- [ ] Bot tili tanlash (uz/ru/en) — foydalanuvchi profilidan olinadimi?

---

## 4. Funksional modullar 🟡 (discovery kutilmoqda)

> Quyidagilar eski loyihada mavjud — yangi TZ'da qaysilari qoladi/o'zgaradi/qo'shiladi, discovery'da hal qilinadi.

Nomzod modullar: Auth & profil · Akademik struktura · Baholash · Dars jadvali · Davomat · Imtihon/test · Topshiriqlar · Qabul (admissions) · To'lov · Hujjatlar · Chat/Forum · E'lonlar/Push · Gamifikatsiya/Musobaqa · AI · Hisobot/Analitika.

---

## 5. Rollar & huquqlar matritsasi 🟡 (discovery kutilmoqda)

Eski: `student, teacher, dekanat, investor, admin`. Yangi rollar (rektor, kurator, kafedra mudiri, ota-ona, abituriyent?) — discovery'da.

---

## 6. Ochiq savollar (umumiy discovery)

**A. Fundament**
- [ ] Qaysi universitet / umumiy shablon?
- [ ] Hozir jarayon qanday (qog'oz/Excel/HEMIS/eski tizim)?
- [ ] HEMIS integratsiyasi kerakmi (o'rin bosadimi / yonida ishlaydimi)?
- [ ] Yakuniy rollar ro'yxati?

**B. O'quv jarayoni**
- [ ] Baholash modeli (JN/ON/YN/MI qoladimi?), GPA, retake, attestatsiya.
- [ ] Kredit tizimi (ECTS) yoki soat?
- [ ] Dars jadvali kim tuzadi, avtomatikmi?
- [ ] Davomat: QR / manual / online?
- [ ] Imtihon: savollar banki, proctoring darajasi.

**C. Ma'muriy**
- [ ] Qabul jarayoni platformada bo'ladimi?
- [ ] To'lov: kontrakt, chegirma, gateway (Payme/Click).
- [ ] Hujjatlar: spravka, transkript, sertifikat, buyruqlar.

**D. Qo'shimcha**
- [ ] Gamifikatsiya/musobaqa qoladimi yoki soddalashtiriladimi?
- [ ] AI modullaridan qaysilari birinchi navbatda?
