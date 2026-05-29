const stripeSecret = 'STRIPE_SECRET_KEY="__REVENUE_READY_FAKE_STRIPE_SECRET__"';
const openAiSecret = 'OPENAI_API_KEY="__REVENUE_READY_FAKE_OPENAI_SECRET__"';
const serviceRole =
  'SUPABASE_SERVICE_ROLE_KEY="__REVENUE_READY_FAKE_SUPABASE_SERVICE_ROLE__"';

export async function GET() {
  return Response.json({ ok: Boolean(stripeSecret && openAiSecret && serviceRole) });
}
