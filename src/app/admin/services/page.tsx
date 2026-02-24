import { prisma } from "@/lib/prisma";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Services</h1>
      <ul className="space-y-2">
        {services.map((service) => (
          <li key={service.id} className="rounded border bg-white p-4">
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-slate-600">£{(service.priceCents / 100).toFixed(2)} · {service.durationMinutes}m</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
