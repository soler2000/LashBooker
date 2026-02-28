import { createSignedReadUrlOrNull, hasS3StorageConfig } from "@/lib/s3-storage";

export type JournalImageStorageBackend = "s3" | "database";

const DEFAULT_BACKEND: JournalImageStorageBackend = "database";

export function getJournalImageStorageBackend(): JournalImageStorageBackend {
  const configured = process.env.JOURNAL_IMAGE_STORAGE_BACKEND?.trim().toLowerCase();
  if (configured === "s3") return "s3";
  if (configured === "database") return "database";
  return DEFAULT_BACKEND;
}

export function isJournalImageUploadEnabled() {
  const backend = getJournalImageStorageBackend();
  if (backend === "s3") return hasS3StorageConfig();
  return true;
}

export function getJournalImageReadUrl(objectKey: string) {
  if (objectKey.startsWith("data:")) return objectKey;
  return createSignedReadUrlOrNull(objectKey);
}

