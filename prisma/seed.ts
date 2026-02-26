import { PrismaClient, DepositType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultOwnerEmail = process.env.DEFAULT_OWNER_EMAIL ?? "owner@lashbooker.local";
  const defaultOwnerPassword = process.env.DEFAULT_OWNER_PASSWORD ?? "ChangeMe123!";
  const existingOwner = await prisma.user.findUnique({ where: { email: defaultOwnerEmail } });

  if (!existingOwner) {
    const defaultOwnerPasswordHash = await bcrypt.hash(defaultOwnerPassword, 10);

    await prisma.user.create({
      data: {
        email: defaultOwnerEmail,
        passwordHash: defaultOwnerPasswordHash,
        role: "OWNER",
        mustChangePassword: true,
      },
    });
  }

  await prisma.businessSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      businessName: "Lashed and Lifted",
      timezone: "Europe/London",
      currency: "gbp",
      depositDefaultType: DepositType.PERCENT,
      depositDefaultValue: 30,
      pendingPaymentExpiryMinutes: 30,
      reminderScheduleJson: JSON.stringify([48, 24]),
    },
    update: {
      pendingPaymentExpiryMinutes: 30,
    },
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

  const transactionalTemplates = [
    {
      key: "account_created",
      name: "Account created",
      subject: "Welcome to Lashed and Lifted, {{firstName}}",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>Your account is ready. You can now book appointments online.</p><p>Thanks,<br/>Lashed and Lifted</p>",
      textBody:
        "Hi {{firstName}},\n\nYour account is ready. You can now book appointments online.\n\nThanks,\nLashed and Lifted",
    },
    {
      key: "password_changed",
      name: "Password changed",
      subject: "Your password was changed",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>This is a confirmation that your password was changed for {{email}}.</p><p>If this was not you, reset your password immediately.</p>",
      textBody:
        "Hi {{firstName}},\n\nThis is a confirmation that your password was changed for {{email}}.\nIf this was not you, reset your password immediately.",
    },
    {
      key: "password_recovery",
      name: "Password recovery",
      subject: "Reset your password",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>Use the link below to reset your password:</p><p><a href='{{resetUrl}}'>Reset password</a></p><p>This link expires at {{expiresAt}}.</p>",
      textBody:
        "Hi {{firstName}},\n\nUse the link below to reset your password:\n{{resetUrl}}\n\nThis link expires at {{expiresAt}}.",
    },
    {
      key: "booking_confirmed",
      name: "Booking confirmed",
      subject: "Booking #{{bookingId}} is confirmed",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>Your booking for {{serviceName}} is confirmed.</p><p>When: {{startAt}}<br/>Booking ID: {{bookingId}}</p>",
      textBody:
        "Hi {{firstName}},\n\nYour booking for {{serviceName}} is confirmed.\nWhen: {{startAt}}\nBooking ID: {{bookingId}}",
    },
    {
      key: "booking_cancellation_confirmed",
      name: "Booking cancellation confirmed",
      subject: "Booking #{{bookingId}} has been cancelled",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>Your booking for {{serviceName}} on {{startAt}} has been cancelled.</p><p>Booking ID: {{bookingId}}</p>",
      textBody:
        "Hi {{firstName}},\n\nYour booking for {{serviceName}} on {{startAt}} has been cancelled.\nBooking ID: {{bookingId}}",
    },
    {
      key: "booking_change_confirmed",
      name: "Booking change confirmed",
      subject: "Booking #{{bookingId}} has been updated",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>Your booking has been updated.</p><p>New time: {{startAt}}<br/>Service: {{serviceName}}<br/>Booking ID: {{bookingId}}</p>",
      textBody:
        "Hi {{firstName}},\n\nYour booking has been updated.\nNew time: {{startAt}}\nService: {{serviceName}}\nBooking ID: {{bookingId}}",
    },
    {
      key: "booking_reminder",
      name: "Booking reminder",
      subject: "Reminder: booking #{{bookingId}} at {{startAt}}",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>This is a reminder for your upcoming appointment.</p><p>Service: {{serviceName}}<br/>When: {{startAt}}<br/>Booking ID: {{bookingId}}</p>",
      textBody:
        "Hi {{firstName}},\n\nThis is a reminder for your upcoming appointment.\nService: {{serviceName}}\nWhen: {{startAt}}\nBooking ID: {{bookingId}}",
    },
    {
      key: "missed_booking_notification",
      name: "Missed booking notification",
      subject: "We missed you today (booking #{{bookingId}})",
      htmlBody:
        "<p>Hi {{firstName}},</p><p>We noticed you missed your booking for {{serviceName}} at {{startAt}}.</p><p>Please contact us if you need help rebooking.</p>",
      textBody:
        "Hi {{firstName}},\n\nWe noticed you missed your booking for {{serviceName}} at {{startAt}}.\nPlease contact us if you need help rebooking.",
    },
  ] as const;

  for (const template of transactionalTemplates) {
    await prisma.transactionalEmailTemplate.upsert({
      where: { key: template.key },
      create: template,
      update: {
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());
