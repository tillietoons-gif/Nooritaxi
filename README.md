# Noori Super App

Noori is structured as Afghanistan's everyday super app for transportation, delivery, logistics, commerce, and payments. The implementation is optimized around trust, simplicity, safety, fast flows, low bandwidth, and low-end device support.

## Apps

- `backend`: NestJS REST API with Prisma/PostgreSQL, JWT authentication, wallet ledger, ride, delivery, restaurant, order, admin, support, notification, search, referral, loyalty, promo, and surge pricing foundations.
- `web`: Next.js responsive web app with public pages, dashboard, admin operations view, and dark mode.
- `mobile`: React Native/Expo-style mobile screens for rider onboarding, trips, wallet, and profile.

## Backend Architecture

All backend routes are prefixed with `/api`.

Core REST areas:

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/verify-phone`, `POST /api/auth/logout`
- Rides: `POST /api/rides`, `GET /api/rides`, `PATCH /api/rides/:id`, plus compatibility routes under `/api/trips`
- Drivers and vehicles: `POST /api/drivers`, `GET /api/drivers`, `POST /api/drivers/:driverId/vehicles`, `GET /api/vehicles`
- Riders: `POST /api/riders/:userId`
- Restaurants: `POST /api/restaurants`, `GET /api/restaurants`, `POST /api/restaurants/:restaurantId/menu-items`
- Orders: `POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/:id`
- Deliveries: `POST /api/deliveries`, `GET /api/deliveries`, `PATCH /api/deliveries/:id`
- Wallets: `GET /api/wallet/:userId`, `POST /api/wallet/:userId/deposit`, `POST /api/wallet/:userId/debit`
- Promotions: `POST /api/promotions`, `GET /api/promotions`, `POST /api/promotions/redeem`
- Loyalty: `POST /api/loyalty/:userId/points`
- Notifications: `POST /api/notifications`, `GET /api/notifications/:userId`, `POST /api/notifications/devices`
- Support: `POST /api/support/tickets`, `GET /api/support/tickets`, `POST /api/support/tickets/:ticketId/messages`
- Reviews: `POST /api/reviews`
- Smart search and voice search: `GET /api/search?q=...`, `POST /api/voice-search`
- Admin: `GET /api/admin/overview`

## Database Schema

The Prisma schema covers:

- Users, riders, drivers, vehicles, driver tiers, verification, and referral links
- Trips with safety code, cash/wallet payment methods, surge multiplier, and status history timestamps
- Restaurants, menu items, orders, order items, and food delivery linkage
- Standalone deliveries for parcels and logistics
- Wallets and immutable transaction records
- Reviews for drivers, riders, restaurants, orders, and deliveries
- Promotions, promo redemptions, loyalty accounts, and surge zones
- Push devices, notifications, support tickets, and support chat messages

## Local Development

Backend:

```bash
cd backend
npm ci
cp .env.example .env
npm run prisma:dev
npm run start:dev
```

Web:

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Docker:

```bash
docker compose up --build
```

## Environment Variables

Backend variables are documented in `backend/.env.example`.

Web variables are documented in `web/.env.example`.

Mobile variables are documented in `mobile/.env.example`.

Production essentials:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: strong JWT signing secret
- `CORS_ORIGIN`: comma-separated allowed frontend origins
- `NEXT_PUBLIC_API_URL`: public REST API base URL
- `NEXT_PUBLIC_SOCKET_URL`: public realtime tracking socket URL
- Firebase keys for push notifications
- Google Cloud project, region, Secret Manager values, and Cloud SQL/PostgreSQL connection settings

## Deployment Targets

- Vercel: `vercel.json` builds the `web` app.
- Railway: `railway.json` and `backend/Dockerfile` deploy the API.
- Firebase: `firebase.json` is prepared for static/export hosting workflows.
- Google Cloud: `gcp/cloudbuild-backend.yaml` and `gcp/cloud-run-backend.yaml` deploy the API to Cloud Run.
- Docker: root `docker-compose.yml` runs Postgres, backend, and web together.
- CI/CD: `.github/workflows/ci.yml` installs, generates Prisma client, tests, lints, and builds.

## Product Principles

- Keep primary actions reachable in one or two taps.
- Prefer cached lists, concise payloads, and low-image modes for weak networks.
- Support Dari, Pashto, and English from the data model and UI structure.
- Use wallet and cash flows because both are needed locally.
- Keep safety visible: driver verification, support tickets, notifications, tracking, and safety codes are first-class backend concepts.
