# Deploying Casaway

The repo contains an Express API (`backend/`) and a static Leaflet PWA (`frontend/client/`).
Two deployment targets are supported out of the box.

## Environment variables (both targets)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string (MongoDB Atlas recommended) |

> The e-commerce variables from the old Libassi stack (`SESSION_SECRET`, Stripe keys,
> admin credentials) are no longer needed — that code was removed in the Casaway rebrand.

Seed the route catalogue once against your database:

```bash
MONGO_URI="mongodb+srv://..." npm run seed:routes --workspace=backend
```

## Vercel (recommended)

The repo uses npm workspaces (`backend`, `frontend/client`, `frontend/admin`) and a
multi-service `vercel.json`: the backend deploys as an Express service (root `backend/`),
while the client and admin SPAs build with Vite. `/api/*` routes to the backend service
everything else falls through to the client.

```bash
npm i -g vercel
vercel          # link/create the project
vercel env add MONGO_URI
vercel --prod
```

Static assets are served from the CDN edge; the Express service only handles `/api/*`.

## AWS (Docker → App Runner / ECS Fargate)

`Dockerfile` builds the client and runs the full Express server (`backend/server.js`,
which also serves the built client).

```bash
aws ecr create-repository --repository-name casaway
docker build -t casaway .
docker tag casaway:latest <account>.dkr.ecr.<region>.amazonaws.com/casaway:latest
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker push <account>.dkr.ecr.<region>.amazonaws.com/casaway:latest
```

Then create an **App Runner** service (simplest) or an ECS Fargate service pointing at
that ECR image, with `PORT=8080` and the env vars above. App Runner terminates TLS, so
the PWA/service worker and "Add to Home Screen" work the same as on Vercel.

## Vercel vs AWS for the iPhone experience

Hosting does not change the iOS experience much — what matters is HTTPS, a web manifest,
PNG touch icons and a working service worker, all of which both platforms provide (and
which this repo now ships: `apple-touch-icon.png`, `apple-mobile-web-app-*` meta tags,
offline shell caching).

- **Vercel**: zero-config, generous free tier, instant rollbacks, edge CDN. Best fit for
  this app unless you already run AWS infrastructure.
- **AWS (App Runner/ECS)**: full Node server, fixed monthly cost predictability, VPC
  access (e.g. a database in a private subnet). More knobs to turn.

Note: iOS Safari caps standalone PWA storage and can evict the service worker cache under
storage pressure; the app therefore keeps an IndexedDB snapshot plus a bundled depot
fallback so it still opens offline even after an eviction.
