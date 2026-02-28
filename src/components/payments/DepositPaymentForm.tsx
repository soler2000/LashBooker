"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type DepositPaymentFormProps = {
  bookingId: string;
  returnUrl: string;
  onSuccess: () => void;
};

export default function DepositPaymentForm({ bookingId, returnUrl, onSuccess }: DepositPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: returnUrl },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      onSuccess();
      return;
    }

    setError("Payment is processing. Please refresh this page shortly.");
    setIsSubmitting(false);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="text-sm text-gray-700">Booking {bookingId} requires a deposit to confirm.</p>
      <PaymentElement />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={!stripe || isSubmitting}>
        {isSubmitting ? "Processing payment…" : "Pay deposit"}
      </button>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
