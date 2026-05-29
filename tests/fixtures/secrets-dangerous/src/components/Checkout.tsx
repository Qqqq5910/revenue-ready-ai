"use client";

export function Checkout() {
  const stripeSecret = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  return <button disabled={!stripeSecret || !openAiKey}>Pay</button>;
}
