# Noori Backend

NestJS API for the Noori super app. It exposes REST endpoints for authentication, rides, food ordering, parcel delivery, wallets, transactions, promotions, loyalty, notifications, support, reviews, smart search, and admin operations.

## Setup

```bash
npm ci
cp .env.example .env
npm run prisma:generate
npm run start:dev
```

## Database

The API uses Prisma with PostgreSQL.

```bash
npm run prisma:dev
npm run prisma:migrate
```

## Deployment

The backend can run anywhere Docker is supported. Current deployment templates are:

- `../docker-compose.yml` for local Docker with Postgres
- `../railway.json` for Railway
- `../gcp/cloudbuild-backend.yaml` for Google Cloud Build
- `../gcp/cloud-run-backend.yaml` for Google Cloud Run

Google Cloud secrets expected by the Cloud Run template:

- `noori-database-url`
- `noori-jwt-secret`

## Verification

```bash
npm test -- --runInBand
npm run build
```
