import { spawn } from "node:child_process";

let activeChild = null;
let shuttingDown = false;

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
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
  return `postgresql://${username}:${password}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require&schema=public`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: false,
    });

    activeChild = child;

    child.on("exit", (code, signal) => {
      activeChild = null;
      if (shuttingDown && (signal === "SIGTERM" || signal === "SIGINT")) {
        resolve();
        return;
      }

      if (code === 0) resolve();
      else {
        const details = signal
          ? `signal ${signal}`
          : `code ${code ?? "unknown"}`;
        reject(new Error(`${command} ${args.join(" ")} exited with ${details}`));
      }
    });

    child.on("error", (error) => {
      activeChild = null;
      reject(error);
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shuttingDown = true;

    if (activeChild && !activeChild.killed) {
      activeChild.kill(signal);
      return;
    }

    process.exit(0);
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

    console.info("[startup] Running prisma seed to ensure default data exists...");
    await run("npx", ["tsx", "prisma/seed.ts"]);
  }

  console.info("[startup] Starting Next.js server...");
  await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "8080"]);
}

main().catch((error) => {
  console.error("[startup] Failed to boot application", error);
  process.exit(1);
});
