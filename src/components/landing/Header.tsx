import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-12">
      <p className="text-xs uppercase tracking-[0.35em] text-white/75">LashBooker Studio</p>
      <nav aria-label="Primary" className="flex items-center gap-2 md:gap-3">
        <Link
          href="/book"
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/85"
        >
          Book now
        </Link>
        <Link
          href="/policies"
          className="rounded-full border border-white/60 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
        >
          Policies
        </Link>
        <Link href="/login" className="px-2 py-2 text-sm font-medium text-white/85 transition hover:text-white">
          Login
        </Link>
      </nav>
    </header>
  );
}
