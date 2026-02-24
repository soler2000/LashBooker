import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

export function calculateDepositAmount(priceCents: number, depositType: "NONE" | "FIXED" | "PERCENT", depositValue: number) {
  if (depositType === "NONE") return priceCents;
  if (depositType === "FIXED") return Math.min(priceCents, depositValue);
  return Math.min(priceCents, Math.round((priceCents * depositValue) / 100));
}
