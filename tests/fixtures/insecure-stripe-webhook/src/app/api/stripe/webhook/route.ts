export async function POST(request: Request) {
  const event = await request.json();

  if (event.type === "checkout.session.completed") {
    await db.subscription.update({
      where: { stripeCustomerId: event.data.object.customer },
      data: { status: "active" },
    });
  }

  return Response.json({ ok: true });
}

const db = {
  subscription: {
    update: async () => undefined,
  },
};
