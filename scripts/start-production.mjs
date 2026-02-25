import { spawn } from "node:child_process";

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "database_URL",
  "DATABASE_PRIVATE_URL",
  "DATABASE_PUBLIC_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
];

function resolveDatabaseUrl() {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    return undefined;
  }

  const username = encodeURIComponent(PGUSER);
  const password = encodeURIComponent(PGPASSWORD);
  return `postgresql://${username}:${password}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
}

function verifyDatabaseConnectionAndWrites() {
  return run("npx", [
    "prisma",
    "db",
    "execute",
    "--stdin",
    "--url",
    process.env.DATABASE_URL,
  ], `SELECT 1;
CREATE TEMP TABLE codex_db_write_check(id INT);
INSERT INTO codex_db_write_check(id) VALUES (1);
SELECT id FROM codex_db_write_check LIMIT 1;`);
}

function run(command, args, stdin = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
      shell: false,
    });

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const resolvedDatabaseUrl = resolveDatabaseUrl();
  if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
    process.env.DATABASE_URL = resolvedDatabaseUrl;
    console.info("[startup] DATABASE_URL was not set. Using fallback URL from available Postgres env vars.");
  }

  if (!process.env.DATABASE_URL) {
    console.warn("[startup] DATABASE_URL is not configured. Skipping Prisma migrations.");
  } else {
    console.info("[startup] Running prisma migrate deploy...");
    await run("npx", ["prisma", "migrate", "deploy"]);

    console.info("[startup] Verifying database connectivity and write access...");
    await verifyDatabaseConnectionAndWrites();
  }

  console.info("[startup] Starting Next.js server...");
  await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "8080"]);
}

main().catch((error) => {
  console.error("[startup] Failed to boot application", error);
  process.exit(1);
});
