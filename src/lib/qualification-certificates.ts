export type QualificationCertificateContent = {
  title: string;
  description: string;
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

      return { title, description };
    })
    .filter((item): item is QualificationCertificateContent => item !== null);

  if (parsed.length === 0) {
    return defaultQualificationCertificates;
  }

  return parsed;
}
