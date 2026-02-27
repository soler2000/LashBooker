import Link from "next/link";

const LAST_UPDATED = "February 2026";

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl p-8 text-gray-100">
      <header>
        <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
        <p className="mt-3 text-sm text-gray-200">
          This page explains how Lashed and Lifted uses cookies and similar technologies across our website.
        </p>
        <p className="mt-1 text-xs text-gray-300">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">What cookies are</h2>
        <p className="mt-3 text-sm text-gray-100">
          Cookies are small text files stored on your device when you visit a website. They help keep the site secure,
          remember your preferences, and support core features like signing in and completing a booking.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">How we use cookies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-100">
          <li>
            <span className="font-medium">Essential cookies:</span> Required for core functionality such as session
            authentication, account access, and protection against abuse.
          </li>
          <li>
            <span className="font-medium">Preference cookies:</span> Used to remember non-sensitive preferences that
            improve your experience.
          </li>
          <li>
            <span className="font-medium">Performance cookies:</span> May be used to understand site usage patterns
            so we can improve reliability and usability.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Managing cookies</h2>
        <p className="mt-3 text-sm text-gray-100">
          Most browsers let you control or delete cookies in settings. Disabling certain cookies may limit features,
          including login and booking workflows.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p className="mt-3 text-sm text-gray-100">
          If you have questions about this policy, contact the studio directly before using the booking platform.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/book"
          className="inline-flex rounded bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Book your appointment
        </Link>
        <Link
          href="/policies"
          className="inline-flex rounded border border-white/30 px-5 py-3 text-sm font-medium text-white transition hover:border-white/60"
        >
          View studio policies
        </Link>
      </div>
    </main>
  );
}
