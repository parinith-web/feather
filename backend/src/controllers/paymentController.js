import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import {
  createProCheckoutTransaction,
  verifyPaddleWebhookSignature,
  paddlePublicConfig,
} from "../services/paddleService.js";

// GET /api/payments/config
// Public. Gives the frontend what it needs to initialize Paddle.js
// (Paddle.Initialize({ token }) with environment + price id for the Pro card).
export const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json(paddlePublicConfig());
});

// POST /api/payments/create-checkout
// Auth required. Creates a Paddle transaction server-side (so the price can't
// be tampered with) and tags it with the user's Firebase UID via custom_data.
// The frontend opens Paddle.js's checkout with the returned transactionId:
//   Paddle.Checkout.open({ transactionId })
export const createCheckout = asyncHandler(async (req, res) => {
  const user = req.dbUser;

  if (user.plan === "pro") {
    throw new ApiError(400, "This account already has Pro access.");
  }

  const { transactionId, status } = await createProCheckoutTransaction({
    firebaseUid: user.firebaseUid,
    email: user.email,
  });

  res.json({ transactionId, status });
});

// POST /api/payments/webhook
// Public endpoint hit by Paddle's servers. Must receive the RAW request body
// (see server.js — this route is mounted with express.raw()) because the
// signature is computed over the exact bytes Paddle sent.
export const handlePaddleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["paddle-signature"];
  const rawBody = req.body; // Buffer, thanks to express.raw()

  const valid = verifyPaddleWebhookSignature(rawBody, signature);
  if (!valid) {
    throw new ApiError(401, "Invalid Paddle webhook signature.");
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  switch (event.event_type) {
    case "transaction.completed": {
      const tx = event.data;
      const firebaseUid = tx.custom_data?.firebaseUid;
      if (!firebaseUid) {
        console.warn("[paddle webhook] transaction.completed missing custom_data.firebaseUid");
        break;
      }

      await User.findOneAndUpdate(
        { firebaseUid },
        {
          plan: "pro",
          proSince: new Date(),
          paddleCustomerId: tx.customer_id || null,
          paddleTransactionId: tx.id || null,
        }
      );
      console.log(`[paddle webhook] upgraded ${firebaseUid} to Pro (transaction ${tx.id})`);
      break;
    }

    // Handle refunds/chargebacks by reverting Pro access, since the pricing
    // model is a one-time "lifetime" purchase rather than a subscription.
    case "transaction.payment_failed":
    case "adjustment.created": {
      const tx = event.data;
      const isRefund = event.event_type === "adjustment.created" && tx.action === "refund";
      if (isRefund) {
        const firebaseUid = tx.custom_data?.firebaseUid;
        if (firebaseUid) {
          await User.findOneAndUpdate({ firebaseUid }, { plan: "free" });
          console.log(`[paddle webhook] reverted ${firebaseUid} to Free (refund)`);
        }
      }
      break;
    }

    default:
      // Ignore other event types (transaction.created, transaction.updated, etc).
      break;
  }

  // Paddle just needs a 200 to know the webhook was received.
  res.status(200).json({ received: true });
});
