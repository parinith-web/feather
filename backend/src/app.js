import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bgRoutes from "./routes/bgRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { handlePaddleWebhook } from "./controllers/paymentController.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  const allowedOrigins = (process.env.CLIENT_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    })
  );

  // --- Paddle webhook: must be mounted BEFORE express.json() and receive the
  // raw request body, since Paddle's signature is computed over the exact
  // bytes it sent, not a re-serialized JSON object. ---
  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handlePaddleWebhook);

  // Body parsers for every other route. Generous JSON limit because history
  // uploads arrive as base64 data URLs in the request body.
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Basic global rate limit as a safety net; per-route limits can be added
  // where it matters most (e.g. /api/bg/remove).
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (req, res) => res.json({ ok: true, service: "snapcut-backend" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/bg", bgRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/payments", paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
