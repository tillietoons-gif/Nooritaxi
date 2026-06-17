# Noori Taxi / Noori Super App Project Report

Date: 2026-06-17

## Executive Summary

Noori is a multi-surface super app for rides, food, parcel delivery, wallets, loyalty, driver/merchant operations, and platform administration.

The project is now in a runnable and verified state for the main backend, web/admin application, and primary Expo mobile test suite. Several admin screens were completed by reconnecting them to their live backend contracts, restoring accessible controls, fixing stale endpoint usage, and adding honest empty states.

## Applications

| Area | Path | Stack | Status |
| --- | --- | --- | --- |
| Backend API | `backend/` | NestJS, Prisma, PostgreSQL, Socket.IO | Builds and tests pass |
| Web/Admin | `web/` | Next.js 16, React 19, Tailwind, shadcn-style UI, Vitest | Builds and tests pass |
| Primary mobile app | `mobile/` | Expo Router, React Native, NativeWind, Vitest | Tests pass |
| Driver app shell | `mobile-driver/` | Expo, React Native | Runnable shell; no automated tests configured |
| Merchant app shell | `mobile-merchant/` | Expo, React Native | Runnable shell; no automated tests configured |
| Android native folder | `android/` | Gradle/React Native Android | Present for native builds |

## Core Capabilities

- Authentication with JWT, OTP/refresh token database support, guarded admin routes, and RBAC permissions.
- Ride lifecycle with trips, dispatch, live tracking, surge, airport queues, reviews, and safety support.
- Super app commerce with food ordering, parcel delivery, cart/checkout, merchant flows, loyalty, promotions, and notifications.
- Driver operations with KYC, driver work state, wallets, cash ledger, tiers, fleets, vehicles, and payouts.
- Admin web console for operations, live map, users, roles, permissions, finance, cash collection, refunds, reviews, vehicles, airport operations, fraud, CMS, marketing, subscriptions, support, deliveries, orders, trips, and fleet analytics.
- Deployment templates for Docker Compose, Railway, Render, Vercel, and Google Cloud Run/Cloud Build.

## Completion Work Done

- Completed airport admin page live data flow:
  - Loads `/admin/airports`.
  - Loads selected airport analytics, queue, and flights.
  - Handles empty airport state honestly.

- Completed finance admin contract alignment:
  - Cash collections now use `/admin/finance/analytics`, `/admin/finance/settlements`, `/admin/finance/cash-collections?limit=100`, and `/admin/finance/collect-cash`.
  - Refund processing now uses the backend controller route `PUT /admin/finance/refunds/:id`.
  - Refund status filtering now queries the backend with `?status=...`.

- Completed RBAC admin page behavior:
  - Permissions now load from `/admin/roles/permissions`.
  - Role permission mapping supports the backend nested `{ permission }` response shape.
  - Added accessible labels and summary counts.

- Completed admin users page behavior:
  - Roles load once from `/admin/roles`.
  - Admin search queries `/admin/users?role=ADMIN&limit=100&q=...`.
  - Added RBAC role filtering and clear result summaries.

- Improved shared/admin UI verification:
  - Admin list page now uses page size 25 to match backend/admin test contract.
  - Vehicle admin page now displays inspection records or an honest empty state.

## Verification Results

All available automated checks pass:

| Command | Result |
| --- | --- |
| `cd backend && npm test -- --runInBand` | 17 suites, 47 tests passed |
| `cd backend && npm run build` | Passed |
| `cd web && npm test` | 10 files, 12 tests passed |
| `cd web && npm run build` | Passed, 52 app routes generated |
| `cd mobile && npm test` | 1 file, 3 tests passed |

The driver and merchant packages do not currently define test or build scripts beyond Expo start commands.

## Local Runbook

### Full Docker Stack

```bash
docker compose up --build
```

Services:

- Web: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- PostgreSQL: `localhost:5432`

### Backend

```bash
cd backend
npm ci
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noori?schema=public
set JWT_SECRET=local-dev-secret
npm run prisma:generate
npm run prisma:dev
npm run prisma:seed
npm run start:dev
```

### Web

```bash
cd web
npm ci
copy .env.example .env.local
npm run dev
```

### Mobile

```bash
cd mobile
npm ci
npm run start
```

Driver and merchant shells:

```bash
cd mobile-driver
npm ci
npm run start

cd mobile-merchant
npm ci
npm run start
```

## Environment Variables

Backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`
- Firebase/service credentials if push notifications are enabled in deployed environments.

Web:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

Docker Compose provides local defaults for the backend and web services.

## Deployment Notes

- `docker-compose.yml` supports local containerized development.
- `backend/Dockerfile` and `web/Dockerfile` are present.
- `railway.json`, `render.yaml`, `vercel.json`, and `gcp/` templates are present.
- Google Cloud templates expect secrets named `noori-database-url` and `noori-jwt-secret`.

## Remaining Operational Work

These are not blockers for local verification, but should be handled before a production launch:

- Create real production secrets and remove any local/demo credentials from deployment environments.
- Run a real PostgreSQL migration/seed cycle against staging.
- Configure Firebase push credentials and VAPID key if push notifications are required.
- Add automated checks for `mobile-driver/` and `mobile-merchant/`.
- Add end-to-end smoke tests against Docker Compose or a staging deployment.
- Confirm production payment, refund, and cash collection workflows with real finance policy.

## Current Readiness

The project is complete enough for local development, demo, admin workflow testing, and staging deployment preparation. The verified backend and web surfaces are green, and the main mobile package has a passing test suite.
