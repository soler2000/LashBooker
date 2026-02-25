import crypto from "node:crypto";

type StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: URL;
  region: string;
};

function readStorageConfig(): StorageConfig | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const endpointRaw = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim() || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !bucket || !endpointRaw) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: new URL(endpointRaw),
    region,
  };
}

function getStorageConfig(): StorageConfig {
  const config = readStorageConfig();
  if (!config) {
    throw new Error(
      "Missing S3 storage configuration (S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT)",
    );
  }
  return config;
}

export function hasS3StorageConfig() {
  return Boolean(readStorageConfig());
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodePath(pathPart: string) {
  return pathPart.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function hmac(key: crypto.BinaryLike, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getSigningKey(secretAccessKey: string, shortDate: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, shortDate);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function getObjectUrl(endpoint: URL, bucket: string, objectKey: string) {
  const basePath = endpoint.pathname.replace(/\/$/, "");
  const objectPath = `${basePath}/${encodePath(bucket)}/${encodePath(objectKey)}`.replace(/\/+/g, "/");
  const url = new URL(endpoint.toString());
  url.pathname = objectPath;
  return url;
}

function signUrl({
  method,
  objectKey,
  expiresInSeconds,
  contentType,
}: {
  method: "PUT" | "GET";
  objectKey: string;
  expiresInSeconds: number;
  contentType?: string;
}) {
  const config = getStorageConfig();
  const url = getObjectUrl(config.endpoint, config.bucket, objectKey);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const shortDate = amzDate.slice(0, 8);
  const credentialScope = `${shortDate}/${config.region}/s3/aws4_request`;
  const signedHeaders = contentType ? "content-type;host" : "host";

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });

  const canonicalHeaders = [...(contentType ? [`content-type:${contentType.trim()}`] : []), `host:${url.host}`].join("\n");

  const canonicalRequest = [
    method,
    url.pathname,
    query.toString(),
    `${canonicalHeaders}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");

  const signature = crypto
    .createHmac("sha256", getSigningKey(config.secretAccessKey, shortDate, config.region))
    .update(stringToSign)
    .digest("hex");
  query.set("X-Amz-Signature", signature);
  url.search = query.toString();

  return url.toString();
}

export function createSignedUploadUrl(objectKey: string, contentType: string, expiresInSeconds = 900) {
  return signUrl({ method: "PUT", objectKey, contentType, expiresInSeconds });
}

export function createSignedReadUrl(objectKey: string, expiresInSeconds = 3600) {
  return signUrl({ method: "GET", objectKey, expiresInSeconds });
}

export function createSignedReadUrlOrNull(objectKey: string, expiresInSeconds = 3600) {
  if (!hasS3StorageConfig()) return null;
  return createSignedReadUrl(objectKey, expiresInSeconds);
}
