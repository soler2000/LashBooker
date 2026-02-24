# LashBooker

MVP booking platform for lash studios with deposit-backed appointments.

## Implemented scope

- **PR-1**: Next.js + TypeScript + Tailwind bootstrap, Docker Postgres, Prisma schema, seed.
- **PR-2**: NextAuth credentials auth, registration API, role middleware, admin shell.
- **PR-3**: Service management APIs, public services API, availability engine (working-hours/blockout/overlap checks), booking page slot lookup.
- **PR-4**: Booking creation with Stripe PaymentIntent deposit calculation, Stripe webhook confirmation path, basic confirmation email hook, admin calendar list.

---

## 1) Local development (Docker + Prisma + Next.js)

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- npm 10+
- Stripe CLI (for local webhook forwarding)

### Step-by-step

1. **Clone and enter repo**
   ```bash
   git clone <your-repo-url>
   cd LashBooker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL with Docker**
   ```bash
   docker compose up -d db
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Generate Prisma client + run migrations + seed**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

6. **Run Next.js app**
   ```bash
   npm run dev
   ```

7. Open app at `http://localhost:3000`.

---

## 2) Required environment variables

Copy from `.env.example` and set values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lashbooker"
NEXTAUTH_SECRET="replace-with-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
EMAIL_PROVIDER_API_KEY=""
S3_ENDPOINT=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET=""
APP_BASE_URL="http://localhost:3000"
```

---

## 3) Stripe webhook setup (local)

1. Make sure app runs on port `3000`.
2. Start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Copy displayed signing secret (`whsec_...`) into `.env` as `STRIPE_WEBHOOK_SECRET`.
4. Restart Next.js server after env change.
5. Trigger test event:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

Webhook endpoint implemented at:

- `POST /api/webhooks/stripe`

---

## 4) Production deployment (Render)

This project is currently structured for a **Node web service + managed Postgres** deployment.

### A. Create infrastructure

1. Create a Render **PostgreSQL** instance.
2. Create a Render **Web Service** connected to this repository.
3. Set build/start commands:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm run start`

### B. Set production env vars

In Render service settings, configure:

- `DATABASE_URL` (Render Postgres internal URL)
- `NEXTAUTH_SECRET` (strong random secret)
- `NEXTAUTH_URL` (e.g. `https://app.yourdomain.com`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `EMAIL_PROVIDER_API_KEY`
- `APP_BASE_URL` (same as public URL)
- Optional S3 vars for future journal image uploads:
  - `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

### C. Configure Stripe webhook (production)

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. Endpoint URL:
   - `https://app.yourdomain.com/api/webhooks/stripe`
3. Subscribe at minimum to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret into Render env as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy service.

### D. Post-deploy verification

1. Open production URL.
2. Register a client account.
3. Create booking from `/book`.
4. Confirm webhook marks booking status from `PENDING_PAYMENT` to `CONFIRMED`.

---

## 5) Useful commands

```bash
# Start DB only
docker compose up -d db

# Stop DB
docker compose down

# Dev server
npm run dev

# Lint
npm run lint

# Prisma studio
npx prisma studio
```
