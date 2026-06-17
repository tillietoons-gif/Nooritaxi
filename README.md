# Noori Super App

Noori is a multi-surface taxi and super app platform with a NestJS backend, Next.js web/admin console, Expo mobile app, and separate driver/merchant mobile shells.

Read the full project report in [PROJECT_REPORT.md](./PROJECT_REPORT.md).

## Quick Start

Run the full local stack:

```bash
docker compose up --build
```

Local services:

- Web/admin: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- PostgreSQL: `localhost:5432`

## Verified Commands

```bash
cd backend && npm test -- --runInBand && npm run build
cd web && npm test && npm run build
cd mobile && npm test
```

## Project Layout

- `backend/` - NestJS API, Prisma schema, migrations, seeds, tests.
- `web/` - Next.js customer/admin web app.
- `mobile/` - Main Expo Router mobile app.
- `mobile-driver/` - Driver Expo app shell.
- `mobile-merchant/` - Merchant Expo app shell.
- `android/` - Native Android project.
- `gcp/` - Google Cloud Build and Cloud Run templates.
