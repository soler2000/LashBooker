export const QUALIFICATIONS_STORAGE_KEY = "lashbooker-qualifications";

export type QualificationItem = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export const defaultQualifications: QualificationItem[] = [
  {
    id: "advanced-lash-styling",
    title: "Advanced Lash Styling Certification",
    description:
      "Covers eye-shape analysis, custom lash mapping, and blend design for natural-to-editorial looks.",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1800&q=80",
  },
  {
    id: "hygiene-safety",
    title: "Professional Hygiene & Safety Training",
    description:
      "Focuses on sanitation standards, adhesive handling, and safe isolation practices for every appointment.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=80",
  },
  {
    id: "volume-masterclass",
    title: "Volume Technique Masterclass",
    description:
      "Specialized education in handmade fan creation, retention strategy, and lightweight volume application.",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1800&q=80",
  },
];
