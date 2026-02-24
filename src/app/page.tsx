import Link from "next/link";

const heroShots = [
  {
    title: "Precision artistry",
    description:
      "Every set is tailored to your eye shape, creating a refined look that feels naturally effortless.",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1800&q=80",
  },
  {
    title: "Close-up perfection",
    description:
      "Ultra-fine lash mapping and pro-grade products deliver detail you can see in every blink.",
    image:
      "https://images.unsplash.com/photo-1631217875836-92e35e8e9eec?auto=format&fit=crop&w=1800&q=80",
  },
  {
    title: "Luxury in motion",
    description:
      "A calm, modern studio flow inspired by premium product launches and beautifully paced storytelling.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=80",
  },
];

export default function Home() {
  return (
    <main className="bg-black text-white">
      <section className="relative flex min-h-screen items-end overflow-hidden px-6 pb-16 pt-32 md:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.25) 45%, rgba(0,0,0,.55)), url('https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80')",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/70">LashBooker Studio</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-7xl">
            Elevate every look with cinematic lash detail.
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
            Scroll through an immersive showcase and reserve your next professional lash experience.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/book" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
              Book now
            </Link>
            <Link href="/policies" className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10">
              View policies
            </Link>
          </div>
        </div>
      </section>

      <section className="snap-y snap-mandatory">
        {heroShots.map((shot) => (
          <article key={shot.title} className="relative flex min-h-screen snap-start items-end overflow-hidden px-6 pb-16 pt-24 md:px-12">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.2) 45%, rgba(0,0,0,.68)), url('${shot.image}')`,
              }}
              aria-hidden
            />
            <div className="relative z-10 mx-auto w-full max-w-5xl">
              <h2 className="max-w-2xl text-3xl font-semibold md:text-6xl">{shot.title}</h2>
              <p className="mt-5 max-w-xl text-base text-white/80 md:text-lg">{shot.description}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
