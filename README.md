# LashBooker

MVP booking platform for lash studios with deposit-backed appointments.

## Implemented scope

- **PR-1**: Next.js + TypeScript + Tailwind bootstrap, Docker Postgres, Prisma schema, seed.
- **PR-2**: NextAuth credentials auth, registration API, role middleware, admin shell.
- **PR-3**: Service management APIs, public services API, availability engine (working-hours/blockout/overlap checks), booking page slot lookup.
- **PR-4**: Booking creation with Stripe PaymentIntent deposit calculation, Stripe webhook confirmation path, basic confirmation email hook, admin calendar list.
- **PR-5**: Client portal appointments list, client reschedule/cancel APIs with cutoff rule enforcement, reminder email cron endpoint.

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

   > If your DB only has `_prisma_migrations`, ensure `DATABASE_URL` points at the expected database and `schema=public`.
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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lashbooker?schema=public"
NEXTAUTH_SECRET="replace-with-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
EMAIL_PROVIDER_API_KEY=""
EMAIL_PROVIDER="LOG"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USERNAME=""
SMTP_PASSWORD=""
SMTP_FROM_NAME=""
SMTP_FROM_EMAIL=""
SMTP_REPLY_TO=""
SMTP_USE_TLS="false"
SMTP_USE_STARTTLS="true"
S3_ENDPOINT=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET=""
APP_BASE_URL="http://localhost:3000"
DEFAULT_OWNER_EMAIL="owner@lashbooker.local"
DEFAULT_OWNER_PASSWORD="ChangeMe123!"
```

---

Email delivery resolves transport from persisted admin settings (`/admin/email-settings`) first, then falls back to environment variables. If SMTP is incomplete or disabled, the app safely falls back to LOG transport for local/dev usage.

After running `npm run prisma:seed`, you can sign in with the default owner account from `DEFAULT_OWNER_EMAIL` / `DEFAULT_OWNER_PASSWORD`.
The seed only creates this owner account when it does not already exist, so later deploys/builds will not overwrite existing user credentials.
On first login, the app forces a password change before allowing access to other admin pages.

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

## 4) Production deployment (Railway)

This project is currently structured for a **Node web service + managed Postgres** deployment on Railway.

### A. Create infrastructure

1. Create a Railway **PostgreSQL** service.
2. If you are running your own Postgres container in Railway, configure `PGDATA=/var/lib/postgresql/data` in that DB service so the volume mount path is used for data persistence.
3. Create a Railway **Web Service** connected to this repository.
4. Set build/start commands:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm run start` (this now runs `prisma migrate deploy` automatically before `next start`)

### B. Set production env vars

In Railway, open your **Web Service** → **Variables** and add references to your Postgres service variables.

1. Click **New Variable** and set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
   - This is the internal Railway network URL and should be used by the running app.
2. Add `DATABASE_PRIVATE_URL` as `${{Postgres.DATABASE_PRIVATE_URL}}`.
   - This is useful for scripts/migrations that require a direct DB URL.
3. Optionally add `DATABASE_PUBLIC_URL` as `${{Postgres.DATABASE_PUBLIC_URL}}` if you need to connect from outside Railway.
4. Ensure the selected URL includes SSL (`sslmode=require`).

If you need to define URLs manually, use your Railway hosts like this:

```bash
# Internal (for app runtime inside Railway)
DATABASE_URL="postgresql://<USER>:<PASSWORD>@postgres.railway.internal:5432/<DB_NAME>?sslmode=require&schema=public"

# External (for local scripts or external SQL clients)
DATABASE_PUBLIC_URL="postgresql://<USER>:<PASSWORD>@metro.proxy.rlwy.net:52424/<DB_NAME>?sslmode=require&schema=public"
```

Then configure the rest of the app variables:

- `NEXTAUTH_SECRET` (strong random secret)
- `NEXTAUTH_URL` (e.g. `https://app.yourdomain.com`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_PROVIDER` (`LOG` or `SMTP`; default `LOG`)
- Optional SMTP fallback env vars (used when admin email settings are not configured):
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
  - `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `SMTP_REPLY_TO`
  - `SMTP_USE_TLS`, `SMTP_USE_STARTTLS`
- `APP_BASE_URL` (same as public URL)
- Optional S3 vars for future journal image uploads:
  - `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

If the app still cannot connect, verify the Postgres service is in the same Railway project/environment and that the variable reference points to the correct service name (`Postgres` in the examples above). The startup script can fall back to `DATABASE_PRIVATE_URL`, `DATABASE_PUBLIC_URL`, `POSTGRES_URL`, or `POSTGRES_URL_NON_POOLING` when `DATABASE_URL` is missing, but setting `DATABASE_URL` explicitly is still recommended.

### C. Configure Stripe webhook (production)

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. Endpoint URL:
   - `https://app.yourdomain.com/api/webhooks/stripe`
3. Subscribe at minimum to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret into Railway env as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy service.

### D. Post-deploy verification

1. Open production URL.
2. Register a client account.
3. Create booking from `/book`.
4. Confirm webhook marks booking status from `PENDING_PAYMENT` to `CONFIRMED`.


### E. Configure cron jobs

Set `CRON_SECRET` in your environment and configure your scheduler to call the jobs endpoints with `POST` and header `x-cron-secret: <CRON_SECRET>`.

Recommended schedules:

- `POST /api/jobs/reminders` every hour
- `POST /api/jobs/expire-pending-bookings` every 5 minutes

The pending-payment expiry job cancels bookings still in `PENDING_PAYMENT` after `BusinessSettings.pendingPaymentExpiryMinutes` (default `30`) and attempts to cancel associated Stripe PaymentIntents.

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


## 6) UX follow-up tasks

- [ ] **Homepage transition hardening (main → booking/policies/other nav)**
  - Verify slide panel transition remains seamless across desktop/mobile and touch swipe interactions.
  - Add Playwright coverage for `Book now`/`View policies` transitions and assert no duplicate stacked panel appears during motion.
  - Add reduced-motion fallback (`prefers-reduced-motion`) to disable animated transforms for accessibility while keeping deterministic panel state.
  - Audit image aspect ratio/loading behavior to prevent layout jumps during transitions.
