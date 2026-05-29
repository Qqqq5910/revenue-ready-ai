import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: "price_123", quantity: 1 }],
    success_url: "https://checkout.test/success",
    cancel_url: "https://checkout.test/cancel",
  });

  return Response.json({ url: session.url });
}
