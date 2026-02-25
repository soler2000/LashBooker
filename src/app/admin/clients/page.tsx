import Link from "next/link";
import { prisma, getSchemaSetupHint, hasDatabaseConfiguration } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim() ?? "";

  if (!hasDatabaseConfiguration()) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Database is not configured. Add `DATABASE_URL` (or supported POSTGRES vars) to load client CRM data.
        </p>
      </section>
    );
  }

  try {
    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { clientProfile: { firstName: { contains: q, mode: "insensitive" } } },
                { clientProfile: { lastName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        clientProfile: { select: { firstName: true, lastName: true, phone: true } },
      },
      take: 100,
      orderBy: [{ clientProfile: { lastName: "asc" } }, { email: "asc" }],
    });

    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email"
            className="w-full max-w-md rounded border px-3 py-2"
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">Search</button>
        </form>

        <ul className="space-y-2">
          {clients.map((client) => (
            <li key={client.id} className="rounded border bg-white p-4">
              <p className="font-medium">{client.clientProfile?.firstName} {client.clientProfile?.lastName}</p>
              <p className="text-sm text-slate-600">{client.email}</p>
              {client.clientProfile?.phone ? <p className="text-sm text-slate-600">{client.clientProfile.phone}</p> : null}
              <Link href={`/admin/clients/${client.id}/journal`} className="mt-2 inline-block text-sm text-blue-700 hover:underline">Open profile & journal</Link>
            </li>
          ))}
        </ul>
      </section>
    );
  } catch (error) {
    const hint = getSchemaSetupHint(error);
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {hint ?? (error instanceof Error ? error.message : "Unable to load clients")}
        </p>
      </section>
    );
  }
}
