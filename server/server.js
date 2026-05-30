import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import multer from "multer";
import router from "./routes.js";

// Fix for modern Node.js DNS lookup errors on Windows environments
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Unable to set custom DNS servers:", e.message);
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const requiredProductionEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLIPDROP_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];

const missingProductionEnv = requiredProductionEnv.filter((key) => !process.env[key]);
if (isProduction && missingProductionEnv.length > 0) {
  throw new Error(`Missing required production environment variables: ${missingProductionEnv.join(", ")}`);
}

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "15mb" })); // Support larger image payloads in json if uploaded as base64
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Mount routes
app.use("/api", router);

// Global Error Handler for Multer and General Errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image file is too large. Maximum size allowed is 10MB." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    console.error("Unhandled server error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// Root check
app.get("/", (req, res) => {
  res.send("PurePixels AI Background Remover Express Server is Running!");
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/purepixels";

mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB database successfully.");
    app.listen(PORT, () => {
      console.log(`PurePixels Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failure. Running Express offline fallback...", err.message);
    // Offline fallback for local development if MongoDB is not running locally
    app.listen(PORT, () => {
      console.log(`PurePixels Express server running in offline-mode on port ${PORT} (Database disconnected)`);
    });
  });
