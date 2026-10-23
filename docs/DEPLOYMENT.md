# KinderLens deployment runbook

This runbook covers the production boundary for the current application. The
frontend uses relative `/api` requests, so production should expose the API
behind the same public origin as the frontend, for example:

```text
https://kinderlens.example.com/       -> frontend
https://kinderlens.example.com/api   -> backend
```

The Vite proxy in `frontend/vite.config.js` is for local development only.

## Backend environment

Start from `backend/.env.example` and set:

- `NODE_ENV=production`
- `PORT` to the platform-provided port
- `MONGODB_URI` to a TLS-enabled production MongoDB connection
- `PARENT_SESSION_SECRET` to a random secret of at least 32 characters
- `FRONTEND_ORIGIN` to the exact public frontend origin, without a trailing slash
- `TRUST_PROXY=true` only when the platform terminates TLS and forwards requests
  through a trusted reverse proxy
- `PARENT_PIN` only while the development fallback remains enabled

The backend refuses to start in production when `MONGODB_URI`,
`PARENT_SESSION_SECRET`, or `FRONTEND_ORIGIN` is missing.

## Frontend and API routing

Build the frontend with:

```powershell
Set-Location frontend
npm ci
npm run build
```

Serve `frontend/dist` through the HTTPS web server. Route `/api` to the
backend process. Do not expose the backend directly to the public internet
without HTTPS and the configured origin policy.

## Backend startup

```powershell
Set-Location backend
npm ci
node src/server.js
```

Verify:

```text
GET /health -> {"status":"healthy","service":"kinderlens-backend"}
```

## HTTPS device checklist

Run this checklist on Android Chrome and iPhone Safari:

1. Open the public HTTPS frontend URL.
2. Confirm camera permission can be granted.
3. Capture a clear object and verify a grounded result.
4. Deny camera permission and verify the upload fallback remains usable.
5. Select an image from files and confirm the object flow works.
6. Test a slow or interrupted network request.
7. Confirm Parent account registration and login work.
8. Create a child profile and verify activity ownership.
9. Lock the Parent Dashboard and confirm history is inaccessible.

## Release safeguards

- Never commit `.env` files or production credentials.
- Use a managed MongoDB backup and retention policy.
- Review logs for private image data before enabling centralized logging.
- Keep the shared PIN disabled in production after account migration is
  verified.
- Run the backend, frontend, AI, evaluation, and browser test commands before
  promoting a release.
