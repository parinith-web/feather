import axios from "axios";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

const isSandbox = (process.env.PADDLE_ENV || "sandbox") !== "production";
const PADDLE_API_BASE = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

function paddleClient() {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new ApiError(500, "Server is missing PADDLE_API_KEY configuration.");
  return axios.create({
    baseURL: PADDLE_API_BASE,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
}

/**
 * Creates a Paddle "transaction" for the Pro lifetime price, tagged with the
 * Firebase UID via custom_data so the webhook can identify who paid.
 * The frontend takes the returned transaction id and opens Paddle.js's
 * inline/overlay checkout with it (Paddle.Checkout.open({ transactionId })).
 */
export async function createProCheckoutTransaction({ firebaseUid, email }) {
  const priceId = process.env.PADDLE_PRO_PRICE_ID;
  if (!priceId) throw new ApiError(500, "Server is missing PADDLE_PRO_PRICE_ID configuration.");

  const client = paddleClient();

  try {
    const { data } = await client.post("/transactions", {
      items: [{ price_id: priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      custom_data: { firebaseUid },
    });

    return {
      transactionId: data.data.id,
      status: data.data.status,
    };
  } catch (err) {
    const message = err.response?.data?.error?.detail || "Failed to create Paddle transaction.";
    throw new ApiError(502, message);
  }
}

/**
 * Verifies the `Paddle-Signature` header against the raw request body using
 * the notification webhook secret from the Paddle dashboard.
 * Header format: "ts=<timestamp>;h1=<hex hmac>"
 * Docs: https://developer.paddle.com/webhooks/signature-verification
 */
export function verifyPaddleWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw new ApiError(500, "Server is missing PADDLE_WEBHOOK_SECRET configuration.");
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=").map((s) => s.trim()))
  );
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

export const paddlePublicConfig = () => ({
  environment: isSandbox ? "sandbox" : "production",
  clientToken: process.env.PADDLE_CLIENT_TOKEN || null,
  proPriceId: process.env.PADDLE_PRO_PRICE_ID || null,
});
