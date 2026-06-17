# Noori Taxi / Noori Super App Feature Report

Date: 2026-06-17

## Overview

Noori is a multi-surface transport and super app platform built across a NestJS backend, Next.js web/admin console, Expo mobile app, and separate driver/merchant mobile shells. The repository includes deployment templates for Docker Compose, Railway, Render, Vercel, and Google Cloud.

## Application Surfaces

- `backend/` — NestJS REST API with Prisma, PostgreSQL, Socket.IO, JWT authentication, and RBAC.
- `web/` — Next.js customer/admin web application built with React, Tailwind, and shadcn-style UI.
- `mobile/` — Main Expo Router mobile application.
- `mobile-driver/` — Driver Expo app shell.
- `mobile-merchant/` — Merchant Expo app shell.
- `android/` — Native Android project for React Native.
- `gcp/` — Google Cloud Build and Cloud Run deployment templates.

## Core Platform Features

### User & Authentication

- User authentication with JWT and OTP/refresh token support.
- RBAC permissions and guarded admin routes.
- Admin user role management.
- Support for user search, role filtering, and user administration.

### Rides & Trips

- Full ride lifecycle management.
- Trip dispatching and live tracking.
- Surge pricing and airport queue management.
- Safety workflows and driver reviews.
- Trip reviews and feedback processing.

### Financial Systems

- Wallet management and ledger tracking.
- Payments, refunds, and settlements.
- Cash collections and finance analytics.
- Payouts, driver tiers, and fleet financial controls.

### Super App Commerce

- Food ordering and commerce flows.
- Parcel delivery and logistics workflows.
- Cart, checkout, merchant order handling.
- Loyalty programs and promotions.
- Push notifications for orders and delivery updates.

### Driver & Fleet Operations

- Driver KYC onboarding and verification.
- Driver work state management.
- Driver tiers and performance tracking.
- Fleet management, vehicle registration, and inspection records.
- Corporate / fleet operations support.

### Administration & Operations

- Admin console screens for operations, finance, fraud, reviews, and support.
- Airport operations and queue monitoring.
- CMS management and marketing promotions.
- Support ticketing and fraud monitoring.
- Subscriptions and loyalty management.
- Notifications management and push notification integration.
- Search and place management via `places` module.

### AI & Tracking

- Real-time tracking via Socket.IO.
- AI module support for future smart features.
- Tracking gateway for live updates.

## Backend Feature Modules

The backend app imports these modules in `backend/src/app.module.ts`:

- `AuthModule`
- `UsersModule`
- `TripsModule`
- `WalletModule`
- `SuperAppModule`
- `FoodModule`
- `LogisticsModule`
- `ReviewsModule`
- `DispatchModule`
- `PaymentsModule`
- `SafetyModule`
- `AdminModule`
- `SurgeModule`
- `AdminTrackingModule`
- `KycModule`
- `LoyaltyModule`
- `DriverTiersModule`
- `RolesModule`
- `FleetsModule`
- `FinanceModule`
- `FraudModule`
- `OperationsModule`
- `CorporateModule`
- `AirportModule`
- `SupportModule`
- `MarketingModule`
- `CMSModule`
- `SubscriptionsModule`
- `VehiclesModule`
- `NotificationsModule`
- `AIModule`
- `PlacesModule`

## Deployment & Environment

- `docker-compose.yml` for local containerized development.
- `railway.json` for Railway deployments.
- `render.yaml` for Render deployments.
- `vercel.json` for Vercel deployment.
- `gcp/cloudbuild-backend.yaml` and `gcp/cloud-run-backend.yaml` for Google Cloud.

### Environment Variables

- Backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, plus Firebase/service credentials for push notifications.
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

## Verification & Status

### Verified Commands

- `cd backend && npm test -- --runInBand`
- `cd backend && npm run build`
- `cd web && npm test`
- `cd web && npm run build`
- `cd mobile && npm test`

### Known Status

- Backend build and tests are validated.
- Web build and tests are validated.
- Main mobile package test suite is validated.
- Driver and merchant app shells are present and runnable but do not currently define dedicated automated test scripts.

## Notes

- The project was verified with live admin contract and endpoint alignments in finance, roles, users, and airport modules.
- Real production deployments require secret management, staging migration validation, and push notification credential configuration.
- Additional end-to-end tests are recommended for full production readiness.
