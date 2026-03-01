# Code Review Report

## Scope
- Reviewed commit `c4744e0` (`Add admin settings version badge across system pages`).
- Focused on the newly added `VersionBadge` component and its integration into admin client pages.

## Findings

### 1) Build version fallback will not work in browser for non-public env vars (Medium)
**Where:** `src/components/admin/VersionBadge.tsx`

`VersionBadge` is rendered inside client pages (`"use client"` pages under `src/app/admin/...`). In that context, only `NEXT_PUBLIC_*` env vars are available in the browser bundle.

The fallback chain currently includes `process.env.VERCEL_GIT_COMMIT_SHA`, which is not public and therefore will be `undefined` client-side unless it is copied into a public env var at build time.

**Impact:**
- In production, badge may display `local-dev` even on deployed builds when `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` are unset.
- This can mislead admins during diagnostics by showing an incorrect build identifier.

**Recommendation:**
- Remove reliance on `process.env.VERCEL_GIT_COMMIT_SHA` in client code.
- Ensure the deployment pipeline sets one public variable (for example `NEXT_PUBLIC_APP_VERSION`) from the commit SHA or release tag.
- Optionally, add a short inline comment documenting that this component is client-consumed and therefore must use `NEXT_PUBLIC_*` variables only.

## Positive Notes
- The badge component is simple, reusable, and integrated consistently across admin settings-related screens.
- Truncating long versions to 12 chars improves readability while keeping a full tooltip value.
