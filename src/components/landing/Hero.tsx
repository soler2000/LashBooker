"use client";

import Link from "next/link";
import Scene from "@/components/landing/Scene";

type HeroProps = {
  image: string;
};

export default function Hero({ image }: HeroProps) {
  return (
    <Scene
      image={image}
      overlay="linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.8))"
      imagePriority
      imageSizes="100vw"
      sectionClassName="relative h-screen w-full overflow-hidden"
      contentClassName="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-between px-6 pb-14 pt-8 md:px-12 md:pb-20"
    >
      <header className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-white/75">Lashed and Lifted</p>
        <Link href="/login" className="text-sm font-medium text-white/85 transition hover:text-white">
          Login
        </Link>
      </header>
      <div className="max-w-3xl">
        <h1 className="text-5xl font-semibold leading-tight md:text-8xl">Lash design in motion.</h1>
        <p className="mt-5 max-w-xl text-base text-white/80 md:text-xl">
          A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.
        </p>
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
