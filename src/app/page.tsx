"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Hero from "@/components/landing/Hero";
import HorizontalChapter from "@/components/landing/HorizontalChapter";
import QualificationCertificates, { type CertificateItem } from "@/components/landing/QualificationCertificates";
import Scene from "@/components/landing/Scene";
import StickyStoryScene from "@/components/landing/StickyStoryScene";
import ContactUsForm from "@/components/landing/ContactUsForm";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImages } from "@/lib/site-images";
import {
  defaultQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";

type PublicSettingsResponse = {
  instagramUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
  heroTitle: string;
  heroSubtitle: string;
  scene2Title: string;
  scene2Description: string;
  scene3Title: string;
  scene3Description: string;
  chapter1Title: string;
  chapter1Copy: string;
  chapter2Title: string;
  chapter2Copy: string;
  chapter3Title: string;
  chapter3Copy: string;
  chapter4Title: string;
  chapter4Copy: string;
  bookingCtaTitle: string;
  bookingCtaBody: string;
  qualificationCertificates: QualificationCertificateContent[];
};

type PublicSettingsApiResponse = Partial<PublicSettingsResponse> & {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  scene2Title?: string | null;
  scene2Description?: string | null;
  scene3Title?: string | null;
  scene3Description?: string | null;
  chapter1Title?: string | null;
  chapter1Copy?: string | null;
  chapter2Title?: string | null;
  chapter2Copy?: string | null;
  chapter3Title?: string | null;
  chapter3Copy?: string | null;
  chapter4Title?: string | null;
  chapter4Copy?: string | null;
  bookingCtaTitle?: string | null;
  bookingCtaBody?: string | null;
};

const defaultPublicSettings: PublicSettingsResponse = {
  instagramUrl: null,
  contactPhone: null,
  contactEmail: null,
  addressLine1: null,
  addressLine2: null,
  addressCity: null,
  addressPostcode: null,
  addressCountry: null,
  heroTitle: "Lash design in motion.",
  heroSubtitle: "A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.",
  scene2Title: "Designed around your features.",
  scene2Description:
    "Every appointment starts with personalized mapping so curl, density, and length complement your eyes—not overwhelm them.",
  scene3Title: "Studio calm, editorial results.",
  scene3Description:
    "From consultation to final mirror reveal, each step is paced for comfort while delivering camera-ready detail.",
  chapter1Title: "Classic sets",
  chapter1Copy: "Soft definition for an elegant everyday finish.",
  chapter2Title: "Hybrid blends",
  chapter2Copy: "The balance between texture and featherlight volume.",
  chapter3Title: "Volume artistry",
  chapter3Copy: "Full-bodied drama designed to still feel weightless.",
  chapter4Title: "Refill rhythm",
  chapter4Copy: "A maintenance cadence that keeps your look immaculate.",
  bookingCtaTitle: "Ready for your next set?",
  bookingCtaBody: "Reserve your appointment in minutes and we'll guide you to the perfect service choice.",
  qualificationCertificates: defaultQualificationCertificates,
};

export default function Home() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [publicSettings, setPublicSettings] = useState<PublicSettingsResponse>(defaultPublicSettings);

  useEffect(() => {
    const stored = window.localStorage.getItem(SITE_IMAGES_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<SiteImages>;
      setImages({ ...defaultSiteImages, ...parsed });
    } catch {
      setImages(defaultSiteImages);
    }
  }, []);

  const certificateImages = [images.precision, images.closeup, images.luxury];
  const certificateItems: CertificateItem[] = publicSettings.qualificationCertificates.map((certificate, index) => ({
    title: certificate.title,
    description: certificate.description,
    image: certificate.image?.trim() || certificateImages[index % certificateImages.length],
  }));

  useEffect(() => {
    const loadPublicSettings = async () => {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        setPublicSettings(defaultPublicSettings);
        return;
      }

      const data = (await response.json()) as PublicSettingsApiResponse;
      setPublicSettings({
        ...defaultPublicSettings,
        ...data,
        heroTitle: data.heroTitle ?? defaultPublicSettings.heroTitle,
        heroSubtitle: data.heroSubtitle ?? defaultPublicSettings.heroSubtitle,
        scene2Title: data.scene2Title ?? defaultPublicSettings.scene2Title,
        scene2Description: data.scene2Description ?? defaultPublicSettings.scene2Description,
        scene3Title: data.scene3Title ?? defaultPublicSettings.scene3Title,
        scene3Description: data.scene3Description ?? defaultPublicSettings.scene3Description,
        chapter1Title: data.chapter1Title ?? defaultPublicSettings.chapter1Title,
        chapter1Copy: data.chapter1Copy ?? defaultPublicSettings.chapter1Copy,
        chapter2Title: data.chapter2Title ?? defaultPublicSettings.chapter2Title,
        chapter2Copy: data.chapter2Copy ?? defaultPublicSettings.chapter2Copy,
        chapter3Title: data.chapter3Title ?? defaultPublicSettings.chapter3Title,
        chapter3Copy: data.chapter3Copy ?? defaultPublicSettings.chapter3Copy,
        chapter4Title: data.chapter4Title ?? defaultPublicSettings.chapter4Title,
        chapter4Copy: data.chapter4Copy ?? defaultPublicSettings.chapter4Copy,
        bookingCtaTitle: data.bookingCtaTitle ?? defaultPublicSettings.bookingCtaTitle,
        bookingCtaBody: data.bookingCtaBody ?? defaultPublicSettings.bookingCtaBody,
      });
    };

    loadPublicSettings();
  }, []);

  return (
    <main className="bg-black text-white">
      <Hero
        image={images.hero}
        instagramUrl={publicSettings.instagramUrl}
        contactPhone={publicSettings.contactPhone}
        contactEmail={publicSettings.contactEmail}
        addressLine1={publicSettings.addressLine1}
        addressLine2={publicSettings.addressLine2}
        addressCity={publicSettings.addressCity}
        addressPostcode={publicSettings.addressPostcode}
        addressCountry={publicSettings.addressCountry}
        heroTitle={publicSettings.heroTitle}
        heroSubtitle={publicSettings.heroSubtitle}
      />

      <StickyStoryScene
        eyebrow="Scene 2"
        title={publicSettings.scene2Title || defaultPublicSettings.scene2Title}
        description={publicSettings.scene2Description || defaultPublicSettings.scene2Description}
        image={images.precision}
      />

      <StickyStoryScene
        eyebrow="Scene 3"
        title={publicSettings.scene3Title || defaultPublicSettings.scene3Title}
        description={publicSettings.scene3Description || defaultPublicSettings.scene3Description}
        image={images.luxury}
      />

      <HorizontalChapter
        images={images}
        chapters={[
          {
            title: publicSettings.chapter1Title || defaultPublicSettings.chapter1Title,
            copy: publicSettings.chapter1Copy || defaultPublicSettings.chapter1Copy,
          },
          {
            title: publicSettings.chapter2Title || defaultPublicSettings.chapter2Title,
            copy: publicSettings.chapter2Copy || defaultPublicSettings.chapter2Copy,
          },
          {
            title: publicSettings.chapter3Title || defaultPublicSettings.chapter3Title,
            copy: publicSettings.chapter3Copy || defaultPublicSettings.chapter3Copy,
          },
          {
            title: publicSettings.chapter4Title || defaultPublicSettings.chapter4Title,
            copy: publicSettings.chapter4Copy || defaultPublicSettings.chapter4Copy,
          },
        ]}
      />

      <QualificationCertificates items={certificateItems} />

      <section className="bg-black px-6 py-24 md:px-12">
        <ContactUsForm />
      </section>

      <Scene
        image={images.booking}
        overlay="linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.82))"
        sectionClassName="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-12"
        contentClassName="relative z-10 text-center"
      >
        <h2 className="text-4xl font-semibold md:text-7xl">
          {publicSettings.bookingCtaTitle || defaultPublicSettings.bookingCtaTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/80 md:text-lg">
          {publicSettings.bookingCtaBody || defaultPublicSettings.bookingCtaBody}
        </p>
        <Link href="/book" className="mt-8 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
          Start booking
        </Link>
      </Scene>
    </main>
  );
}
