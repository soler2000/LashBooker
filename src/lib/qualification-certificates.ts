import { isDeprecatedUnsplashImage } from "@/lib/site-images";


export type QualificationCertificateContent = {
  title: string;
  description: string;
  image?: string;
};

export const defaultQualificationCertificates: QualificationCertificateContent[] = [
  {
    title: "Advanced Lash Styling Certification",
    description: "Covers eye-shape analysis, custom lash mapping, and blend design for natural-to-editorial looks.",
  },
  {
    title: "Professional Hygiene & Safety Training",
    description: "Focuses on sanitation standards, adhesive handling, and safe isolation practices for every appointment.",
  },
  {
    title: "Volume Technique Masterclass",
    description: "Specialized education in handmade fan creation, retention strategy, and lightweight volume application.",
  },
];

export function normalizeCertificateText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

const MAX_CERTIFICATE_IMAGE_LENGTH = 2_000_000;

function normalizeCertificateImage(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_CERTIFICATE_IMAGE_LENGTH) {
    return undefined;
  }

  if (isDeprecatedUnsplashImage(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function sanitizeQualificationCertificates(
  value: unknown,
): QualificationCertificateContent[] {
  if (!Array.isArray(value)) {
    return defaultQualificationCertificates;
  }

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const title = normalizeCertificateText((item as { title?: string }).title);
      const description = normalizeCertificateText((item as { description?: string }).description);

      if (!title || !description) {
        return null;
      }

      const image = normalizeCertificateImage((item as { image?: unknown }).image);

      return image ? { title, description, image } : { title, description };
    })
    .filter((item): item is QualificationCertificateContent => item !== null);

  if (parsed.length === 0) {
    return defaultQualificationCertificates;
  }

  return parsed;
}

export function isPdfCertificateAsset(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.startsWith("data:application/pdf") || normalized.endsWith(".pdf");
}
