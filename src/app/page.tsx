"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Hero from "@/components/landing/Hero";
import HorizontalChapter from "@/components/landing/HorizontalChapter";
import QualificationCertificates, { type CertificateItem } from "@/components/landing/QualificationCertificates";
import Scene from "@/components/landing/Scene";
import StickyStoryScene from "@/components/landing/StickyStoryScene";
import ContactUsForm from "@/components/landing/ContactUsForm";
import { defaultSiteImages, sanitizeSiteImages, type SiteImages } from "@/lib/site-images";
import {
  defaultQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { defaultSiteContent, sanitizeSiteContent, type SiteContent } from "@/lib/site-content";

type PublicSettingsResponse = {
  instagramUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
  qualificationCertificates: QualificationCertificateContent[];
  siteImages: SiteImages;
  homepageContent: SiteContent;
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
  qualificationCertificates: defaultQualificationCertificates,
  siteImages: defaultSiteImages,
  homepageContent: defaultSiteContent,
};

export default function Home() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [publicSettings, setPublicSettings] = useState<PublicSettingsResponse>(defaultPublicSettings);

  const certificateImages = [images.chapterClassic, images.chapterHybrid, images.chapterVolume];
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

      const data = (await response.json()) as PublicSettingsResponse;
      setPublicSettings({
        ...defaultPublicSettings,
        ...data,
        siteImages: sanitizeSiteImages(data.siteImages),
        homepageContent: sanitizeSiteContent(data.homepageContent),
      });
      setImages(sanitizeSiteImages(data.siteImages));
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
        content={publicSettings.homepageContent}
      />

      {publicSettings.homepageContent.scene2Enabled ? (
        <StickyStoryScene
          eyebrow={publicSettings.homepageContent.scene2Eyebrow}
          title={publicSettings.homepageContent.scene2Title}
          description={publicSettings.homepageContent.scene2Description}
          image={images.scene2Story}
        />
      ) : null}

      {publicSettings.homepageContent.scene3Enabled ? (
        <StickyStoryScene
          eyebrow={publicSettings.homepageContent.scene3Eyebrow}
          title={publicSettings.homepageContent.scene3Title}
          description={publicSettings.homepageContent.scene3Description}
          image={images.scene3Story}
        />
      ) : null}

      <HorizontalChapter images={images} content={publicSettings.homepageContent} />

      <QualificationCertificates items={certificateItems} />

      <section className="bg-black px-6 py-24 md:px-12">
        <ContactUsForm />
      </section>

      <Scene
        image={images.bookingCta}
        overlay="linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.82))"
        sectionClassName="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-12"
        contentClassName="relative z-10 text-center"
      >
        <h2 className="text-4xl font-semibold md:text-7xl">{publicSettings.homepageContent.bookingCtaTitle}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/80 md:text-lg">{publicSettings.homepageContent.bookingCtaBody}</p>
        <Link href="/book" className="mt-8 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
          {publicSettings.homepageContent.bookingCtaButtonLabel}
        </Link>
      </Scene>
    </main>
  );
}
