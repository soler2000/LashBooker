import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const bookings = await prisma.booking.findMany({
    include: { service: true, client: true },
    orderBy: { startAt: "asc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Calendar</h1>
      <ul className="space-y-2">
        {bookings.map((booking) => (
          <li key={booking.id} className="rounded border bg-white p-4">
            <p className="font-medium">{booking.service.name} · {booking.status}</p>
            <p className="text-sm text-slate-600">{new Date(booking.startAt).toLocaleString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
            <p className="text-sm text-slate-600">Client: {booking.client.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
