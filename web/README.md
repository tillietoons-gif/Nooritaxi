# Noori Web and Admin Console

This directory contains the Next.js customer website and admin console. It is the only application in this repository intended for deployment on Vercel. The NestJS API and PostgreSQL database must be deployed separately.

## Local development

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

The default local API endpoint is `http://localhost:3001/api`.

## Vercel deployment

The repository-root [`vercel.json`](../vercel.json) is configured for this monorepo. It installs and builds from `web/` using the committed `web/package-lock.json`; do not set an Output Directory manually.

1. Deploy the backend and database first, at a public HTTPS URL.
2. In the backend deployment, set `CORS_ORIGIN` to the Vercel production domain. Add preview domains too if previews must access the API. Use a comma-separated list, for example:

   ```text
   https://noori.example.com,https://noori-git-main-your-team.vercel.app
   ```

3. In Vercel, import this repository. Leave **Root Directory** as the repository root so Vercel uses the root `vercel.json`.
4. In **Project Settings → Environment Variables**, add the following values for Production. Add appropriate values for Preview if preview deployments need backend access.

   | Variable | Required | Example |
   | --- | --- | --- |
   | `NEXT_PUBLIC_API_URL` | Yes | `https://api.noori.example.com/api` |
   | `NEXT_PUBLIC_SOCKET_URL` | Yes | `https://api.noori.example.com` |
   | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Only when browser push is enabled | Firebase web push public key |

   `NEXT_PUBLIC_*` variables are deliberately public browser configuration. Do not put database URLs, JWT secrets, SMS credentials, or Firebase server credentials in Vercel.

5. Deploy. Vercel runs:

   ```bash
   npm --prefix web ci
   npm --prefix web run build
   ```

6. Verify the deployed site, login, a customer API call, an admin API call, Socket.IO connectivity, and browser CORS behavior.

### Important notes

- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` are embedded in the client bundle at build time. Redeploy after changing either variable.
- The configured API URL must use HTTPS in production and must include the `/api` suffix. The socket URL must be the API origin without `/api`.
- Vercel does not run the NestJS server, Prisma migrations, PostgreSQL, Socket.IO infrastructure, or durable KYC file storage. Keep those services on a backend-capable platform.
- Vercel preview URLs change per deployment. For predictable preview API access, use a stable preview domain or update backend CORS accordingly.

## Checks

```bash
cd web
npm test
npm run build
```
