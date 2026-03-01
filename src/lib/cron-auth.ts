const LOCAL_ENVIRONMENTS = new Set(["development", "test"]);

function isLocalEnvironment() {
  const env = process.env.NODE_ENV ?? "development";
  return LOCAL_ENVIRONMENTS.has(env);
}

export function hasValidCronSecret(req: Request) {
  const configured = process.env.CRON_SECRET;

  if (!configured) {
    return isLocalEnvironment();
  }

  const incoming = req.headers.get("x-cron-secret");
  return incoming === configured;
}
