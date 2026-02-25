import Link from "next/link";
import ClientJournalManager from "./ClientJournalManager";

export const dynamic = "force-dynamic";

export default async function ClientJournalPage({ params }: { params: { id: string } }) {
  return (
    <section className="space-y-4">
      <Link href="/admin/clients" className="text-sm text-slate-600 hover:underline">← Back to clients</Link>
      <h1 className="text-2xl font-semibold">Client profile & journal</h1>
      <ClientJournalManager clientId={params.id} />
    </section>
  );
}
