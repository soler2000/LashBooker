"use client";

import Image from "next/image";

export type CertificateItem = {
  title: string;
  description: string;
  image: string;
};

type QualificationCertificatesProps = {
  items: CertificateItem[];
};

export default function QualificationCertificates({ items }: QualificationCertificatesProps) {
  return (
    <section className="bg-black px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.28em] text-white/60">Qualifications</p>
        <h2 className="mt-4 text-3xl font-semibold md:text-5xl">Certified artistry you can trust.</h2>
        <p className="mt-4 max-w-3xl text-white/75 md:text-lg">
          Every service is backed by recognized training and safety-first education, so your results stay beautiful and your lashes stay healthy.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03]">
              <div className="relative aspect-[4/3] w-full">
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
