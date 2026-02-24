import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-4xl font-bold">LashBooker</h1>
      <p className="mt-4 text-slate-700">Book lash services with secure deposits.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/book" className="rounded bg-black px-4 py-2 text-white">Book now</Link>
        <Link href="/policies" className="rounded border px-4 py-2">Policies</Link>
      </div>
    </main>
  );
}
