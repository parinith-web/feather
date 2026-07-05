import api from "./client";

// Public — used to initialize Paddle.js on the client.
export async function getPaymentConfig() {
  const { data } = await api.get("/payments/config");
  return data; // { environment, clientToken, proPriceId }
}

// Auth required — creates a server-side Paddle transaction before opening checkout.
export async function createCheckout() {
  const { data } = await api.post("/payments/create-checkout");
  return data; // { transactionId, status }
}
