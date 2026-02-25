import { prisma } from "@/lib/prisma";

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
  }

  return { year, month, day };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  local: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number },
  timeZone: string,
) {
  const utcGuess = Date.UTC(local.year, local.month - 1, local.day, local.hour ?? 0, local.minute ?? 0, local.second ?? 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const firstPass = utcGuess - firstOffset;

  const secondOffset = getTimeZoneOffsetMs(new Date(firstPass), timeZone);
  return new Date(utcGuess - secondOffset);
}

export function getDayBoundsInTimezone(date: string, timeZone: string) {
  const parsed = parseDateParts(date);
  const dayStart = zonedDateTimeToUtc(parsed, timeZone);

  const nextDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const dayEnd = zonedDateTimeToUtc(
    {
      year: nextDate.getUTCFullYear(),
      month: nextDate.getUTCMonth() + 1,
      day: nextDate.getUTCDate(),
    },
    timeZone,
  );

  return { dayStart, dayEnd };
}

export function getWorkingWindowInTimezone(date: string, startTime: string, endTime: string, timeZone: string) {
  const parsedDate = parseDateParts(date);
  const [hStart, mStart] = startTime.split(":").map(Number);
  const [hEnd, mEnd] = endTime.split(":").map(Number);

  const dayStart = zonedDateTimeToUtc({ ...parsedDate, hour: hStart, minute: mStart }, timeZone);
  const dayEnd = zonedDateTimeToUtc({ ...parsedDate, hour: hEnd, minute: mEnd }, timeZone);

  return { dayStart, dayEnd };
}

function getWeekdayFromDateString(date: string) {
  const { year, month, day } = parseDateParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export async function getAvailableSlots(serviceId: string, date: string, incrementMinutes = 15) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return [];

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const timeZone = settings?.timezone || "UTC";

  const weekday = getWeekdayFromDateString(date);
  const wh = await prisma.workingHours.findFirst({ where: { weekday } });
  if (!wh || wh.isClosed) return [];

  const { dayStart, dayEnd } = getWorkingWindowInTimezone(date, wh.startTime, wh.endTime, timeZone);

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
