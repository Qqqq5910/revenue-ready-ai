import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (event.type === "checkout.session.completed") {
    await markSubscriptionActive(event.data.object.customer);
  }

  return Response.json({ received: true });
}

async function markSubscriptionActive(customer: unknown) {
  console.error("subscription activated", customer);
}
