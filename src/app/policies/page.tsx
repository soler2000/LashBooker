import Link from "next/link";

const LAST_UPDATED = "February 2026";

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-3xl p-8 text-gray-100">
      <header>
        <h1 className="text-3xl font-bold text-white">Studio Policies</h1>
        <p className="mt-3 text-sm text-gray-200">Please review these policies before booking your appointment.</p>
        <p className="mt-1 text-xs text-gray-300">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Deposits</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-100">
          <li>A non-refundable deposit is required to secure each appointment.</li>
          <li>Your deposit is applied to your service total at checkout.</li>
          <li>Appointments are only confirmed once deposit payment is received.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Cancellation windows</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-100">
          <li>Reschedules and cancellations must be requested at least 24 hours before your appointment.</li>
          <li>Changes made inside 24 hours may result in deposit forfeiture.</li>
          <li>No same-day cancellation exceptions are guaranteed.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Late arrivals</h2>
        <p className="mt-3 text-sm text-gray-100">
          Please arrive on time. If you are running late, contact us as soon as possible. Arrivals more than 15 minutes
          late may require shortening your service to protect the schedule, and full-service pricing may still apply.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">No-shows</h2>
        <p className="mt-3 text-sm text-gray-100">
          Clients who do not attend a scheduled appointment without notice are considered a no-show and will forfeit
          their deposit. Future bookings may require full prepayment.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Prep guidance</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-100">
          <li>Arrive with clean lashes and avoid mascara or strip lash adhesive residue.</li>
          <li>Remove contact lenses before your appointment if your eyes are sensitive.</li>
          <li>Avoid caffeine immediately beforehand if you are prone to eye fluttering.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Aftercare guidance</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-100">
          <li>Keep lashes dry and steam-free for the first 24 hours.</li>
          <li>Clean lashes daily using a lash-safe cleanser and a soft brush.</li>
          <li>Avoid oil-based products around the eye area to help retention.</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/book"
          className="inline-flex rounded bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Book your appointment
        </Link>
        <Link
          href="/cookie-policy"
          className="inline-flex rounded border border-white/30 px-5 py-3 text-sm font-medium text-white transition hover:border-white/60"
        >
          Cookie policy
        </Link>
      </div>
    </main>
  );
}
