# Main Branch Code Review Report

## Scope & Approach
- Reviewed the current `main` branch tip available in this workspace (`work` branch at `9cfd645`).
- Conducted a broad review across app routing, API surfaces, auth/ops safeguards, and TypeScript test health.
- Performed targeted static inspection and basic validation commands:
  - `rg --files`
  - `rg "process\.env" src/components src/app -n`
  - `npx tsc --noEmit`
  - `npm run lint` (attempted; blocked by interactive ESLint setup prompt)

## Executive Summary
The codebase is generally well-structured, with clear domain boundaries between admin APIs, portal APIs, shared library logic, and Prisma persistence. There are good signs of test coverage for business logic and validation-heavy endpoints.

However, several reliability and operational risks should be addressed:
1. **Type-check failure in test files** indicates drift between booking conflict types and tests.
2. **Client-side version badge fallback uses non-public env var**, causing misleading build metadata in production.
3. **Cron endpoints allow unauthenticated invocation when `CRON_SECRET` is unset**, a risky fail-open behavior.

## Detailed Findings

### 1) Type errors in booking conflict tests (High)
**Where:** `src/lib/booking-conflicts.test.ts`, `src/lib/booking-conflicts.ts`

`BookingWithServiceBuffers` expects flat properties:
- `serviceBufferBeforeMinutes`
- `serviceBufferAfterMinutes`

But tests still pass nested `service: { bufferBeforeMinutes, bufferAfterMinutes }`, which fails `tsc --noEmit` and prevents a clean type-check run.

**Impact:**
- Type-checking is currently red, reducing trust in CI signal quality.
- Regressions can be hidden if developers skip or silence type checks due to existing failures.

**Recommendation:**
- Update fixtures in `booking-conflicts.test.ts` to match `BookingWithServiceBuffers`.
- Add/keep `npx tsc --noEmit` in CI to prevent future drift.

---

### 2) Version badge fallback cannot rely on server-only env var in client bundle (Medium)
**Where:** `src/components/admin/VersionBadge.tsx`

The component is consumed from client-rendered pages. The fallback chain includes `process.env.VERCEL_GIT_COMMIT_SHA`, which is not exposed client-side unless copied into a `NEXT_PUBLIC_*` variable at build time.

**Impact:**
- Badge may incorrectly show `local-dev` in production.
- Admin diagnostics may rely on incorrect build/version metadata.

**Recommendation:**
- Restrict client fallback chain to `NEXT_PUBLIC_*` env vars only.
- Ensure deployment populates `NEXT_PUBLIC_APP_VERSION` (or similar) from commit SHA/release.

---

### 3) Cron auth currently fails open when secret is missing (Medium)
**Where:**
- `src/app/api/jobs/reminders/route.ts`
- `src/app/api/jobs/expire-pending-bookings/route.ts`

`hasValidCronSecret` returns `true` when `CRON_SECRET` is unset. This permits invocation without any authentication in misconfigured environments.

**Impact:**
- Reminder job can be triggered externally.
- Expiry/cancellation job can be triggered externally.
- Operational and data integrity risk increases if deployment config drifts.

**Recommendation:**
- Prefer fail-closed behavior in production (reject when secret is absent).
- Optionally allow fail-open only in explicit local/dev mode.

## Positive Observations
- API organization is clear and feature-scoped (admin, portal, jobs, webhooks).
- Prisma-backed domain modeling is extensive and appears consistently integrated.
- Presence of focused unit tests for availability, metrics, media, and security-related utilities is a strong foundation.

## Suggested Next Actions (Priority Order)
1. Fix `booking-conflicts` test typings and re-run type check.
2. Harden cron endpoint auth policy to fail-closed outside local development.
3. Update version badge env strategy to client-safe `NEXT_PUBLIC_*` variables.
4. Complete ESLint initialization (or provide committed config) so lint runs non-interactively in CI.
