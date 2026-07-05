import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken.js";
import { getPaymentConfig, createCheckout } from "../controllers/paymentController.js";

const router = Router();

// Public — used by the frontend to initialize Paddle.js.
router.get("/config", getPaymentConfig);

// Auth required — creates a server-side transaction before opening checkout.
router.post("/create-checkout", verifyFirebaseToken, createCheckout);

// NOTE: the /api/payments/webhook route is intentionally NOT defined here.
// Paddle's signature check needs the raw request bytes, so it's mounted
// directly in server.js with express.raw() BEFORE the global express.json()
// body parser runs. See server.js for details.

export default router;
