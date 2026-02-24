import { prisma } from "@/lib/prisma";

export async function getAvailableSlots(serviceId: string, date: string, incrementMinutes = 15) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return [];

  const day = new Date(`${date}T00:00:00.000Z`);
  const weekday = day.getUTCDay();
  const wh = await prisma.workingHours.findFirst({ where: { weekday } });
  if (!wh || wh.isClosed) return [];

  const [hStart, mStart] = wh.startTime.split(":").map(Number);
  const [hEnd, mEnd] = wh.endTime.split(":").map(Number);

  const dayStart = new Date(day);
  dayStart.setUTCHours(hStart, mStart, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setUTCHours(hEnd, mEnd, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] } },
    include: { service: true },
  });

  const blockouts = await prisma.blockout.findMany({
    where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
  });

  const slots: { startAt: string; endAt: string }[] = [];
  const totalDuration = service.durationMinutes + service.bufferBeforeMinutes + service.bufferAfterMinutes;

  for (let t = dayStart.getTime(); t + totalDuration * 60000 <= dayEnd.getTime(); t += incrementMinutes * 60000) {
    const start = new Date(t);
    const end = new Date(t + totalDuration * 60000);

    const clashesBooking = bookings.some((b) => {
      const bs = new Date(b.startAt).getTime() - b.service.bufferBeforeMinutes * 60000;
      const be = new Date(b.endAt).getTime() + b.service.bufferAfterMinutes * 60000;
      return start.getTime() < be && end.getTime() > bs;
    });

    const clashesBlockout = blockouts.some((b) => start < b.endAt && end > b.startAt);

    if (!clashesBooking && !clashesBlockout) {
      slots.push({ startAt: start.toISOString(), endAt: new Date(start.getTime() + service.durationMinutes * 60000).toISOString() });
    }
  }

  return slots;
}
