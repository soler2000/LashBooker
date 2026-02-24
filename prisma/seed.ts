import { PrismaClient, DepositType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultOwnerEmail = process.env.DEFAULT_OWNER_EMAIL ?? "owner@lashbooker.local";
  const defaultOwnerPassword = process.env.DEFAULT_OWNER_PASSWORD ?? "ChangeMe123!";
  const defaultOwnerPasswordHash = await bcrypt.hash(defaultOwnerPassword, 10);

  await prisma.user.upsert({
    where: { email: defaultOwnerEmail },
    create: {
      email: defaultOwnerEmail,
      passwordHash: defaultOwnerPasswordHash,
      role: "OWNER",
      mustChangePassword: true,
    },
    update: {
      role: "OWNER",
      passwordHash: defaultOwnerPasswordHash,
      mustChangePassword: true,
    },
  });

  await prisma.businessSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      businessName: "LashBooker Studio",
      timezone: "Europe/London",
      currency: "gbp",
      depositDefaultType: DepositType.PERCENT,
      depositDefaultValue: 30,
      reminderScheduleJson: JSON.stringify([48, 24]),
    },
    update: {},
  });

  const services = [
    { name: "Classic Full Set", description: "Natural classic lashes", durationMinutes: 120, priceCents: 7000 },
    { name: "Hybrid Infill", description: "2-3 week infill", durationMinutes: 90, priceCents: 4500 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      create: { ...service, depositType: DepositType.PERCENT, depositValue: 30 },
      update: {},
    });
  }
}

main().finally(async () => prisma.$disconnect());
