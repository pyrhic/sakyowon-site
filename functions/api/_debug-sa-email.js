export async function onRequestGet(context) {
  const { env } = context;
  const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new Response(JSON.stringify({ client_email: serviceAccount.client_email }), {
    headers: { "Content-Type": "application/json" },
  });
}
