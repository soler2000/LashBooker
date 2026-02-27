"use client";

import Link from "next/link";
import Scene from "@/components/landing/Scene";

type HeroProps = {
  image: string;
  instagramUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressPostcode?: string | null;
  addressCountry?: string | null;
};

function getSafeUrl(value: string | null | undefined, allowedProtocols: string[]) {
  if (!value) return null;

  try {
    const candidate = new URL(value);
    if (!allowedProtocols.includes(candidate.protocol)) {
      return null;
    }

    return candidate.toString();
  } catch {
    return null;
  }
}

export default function Hero({
  image,
  instagramUrl,
  contactPhone,
  contactEmail,
  addressLine1,
  addressLine2,
  addressCity,
  addressPostcode,
  addressCountry,
}: HeroProps) {
  const safeInstagramUrl = getSafeUrl(instagramUrl, ["http:", "https:"]);
  const safeMailtoUrl = getSafeUrl(contactEmail ? `mailto:${contactEmail}` : null, ["mailto:"]);
  const safeTelUrl = getSafeUrl(contactPhone ? `tel:${contactPhone}` : null, ["tel:"]);

  const addressParts = [addressLine1, addressLine2, addressCity, addressPostcode, addressCountry].filter(Boolean);
  const hasContactDetails = Boolean(safeMailtoUrl || safeTelUrl || addressParts.length);

  return (
    <Scene
      image={image}
      overlay="linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.8))"
      imagePriority
      imageSizes="100vw"
      sectionClassName="relative h-screen w-full overflow-hidden"
      contentClassName="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-between px-6 pb-14 pt-8 md:px-12 md:pb-20"
    >
      <header className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-white/75">Lashed and Lifted</p>
        <div className="flex items-center gap-3">
          {safeInstagramUrl ? (
            <a
              href={safeInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white/85 transition hover:text-white"
            >
              Instagram
            </a>
          ) : null}
          <Link href="/login" className="text-sm font-medium text-white/85 transition hover:text-white">
            Login
          </Link>
        </div>
      </header>
      <div className="max-w-3xl">
        <h1 className="text-5xl font-semibold leading-tight md:text-8xl">Lash design in motion.</h1>
        <p className="mt-5 max-w-xl text-base text-white/80 md:text-xl">
          A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.
        </p>
        {hasContactDetails ? (
          <div className="mt-5 space-y-1 text-sm text-white/80">
            {safeTelUrl ? (
              <p>
                <span className="text-white/60">Phone:</span>{" "}
                <a href={safeTelUrl} className="transition hover:text-white">
                  {contactPhone}
                </a>
              </p>
            ) : null}
            {safeMailtoUrl ? (
              <p>
                <span className="text-white/60">Email:</span>{" "}
                <a href={safeMailtoUrl} className="transition hover:text-white">
                  {contactEmail}
                </a>
              </p>
            ) : null}
            {addressParts.length ? (
              <p>
                <span className="text-white/60">Address:</span> {addressParts.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/book" className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
            Book now
          </Link>
        </div>
        <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/75">
          <span>Deposits secure your slot • 24h changes</span>
          <Link
            href="/policies"
            className="inline-flex rounded-full border border-white/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/85 transition hover:border-white/70 hover:bg-white/10"
          >
            /policies
          </Link>
          <Link
            href="/cookie-policy"
            className="inline-flex rounded-full border border-white/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/85 transition hover:border-white/70 hover:bg-white/10"
          >
            /cookie-policy
          </Link>
        </p>
      </div>
    </Scene>
  );
}
