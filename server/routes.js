import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
import { User, Image, Transaction, Usage, PendingSignup } from "./models.js";
import { requireAuth } from "./auth.js";



const router = express.Router();
const isProduction = process.env.NODE_ENV === "production";
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Middleware to prevent hanging operations when MongoDB is offline
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database is offline. Please try again later." });
  }
  next();
};
router.use(checkDbConnection);

// Multer configuration for file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max (aligned with frontend)
});

// Configure Cloudinary if keys exist
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
};
const hasCloudinary = configureCloudinary();

// Configure Razorpay if keys exist
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// Help helper for YYYY-MM-DD date strings
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createServiceError = (message, statusCode = 503) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const createAuthToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "30d" }
  );
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  credits: user.credits,
});

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const getOtpExpiry = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[char]));

const sendSignupOtpEmail = async ({ email, name, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PurePixels <onboarding@resend.dev>";
  const safeName = escapeHtml(name);

  if (!apiKey) {
    if (isProduction) {
      throw createServiceError("Email verification service is not configured.", 503);
    }

    console.log(`[Signup OTP] ${email}: ${otp}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Verify your PurePixels email",
      text: `Hi ${name}, your PurePixels verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a;">
          <h2>Verify your PurePixels email</h2>
          <p>Hi ${safeName},</p>
          <p>Use this code to finish creating your account:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
          <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createServiceError(`Failed to send verification email: ${errorText}`, 502);
  }
};

const removeBackgroundWithClipdrop = async (imageBuffer, mimetype) => {
  const apiKey = (process.env.CLIPDROP_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("CLIPDROP_API_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("image_file", imageBuffer, {
    filename: "image.png",
    contentType: "image/png",
  });

  console.log(`[Clipdrop] Sending request with key: ${apiKey.slice(0, 8)}...`);

  const response = await axios.post("https://clipdrop-api.co/remove-background/v1", formData, {
    headers: {
      ...formData.getHeaders(),
      "x-api-key": apiKey,
    },
    responseType: "arraybuffer",
    timeout: 60000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  console.log(`[Clipdrop] Response status: ${response.status}`);
  return Buffer.from(response.data);
};

const removeBackgroundBuffer = async (imageBuffer, mimetype) => {
  const apiKey = (process.env.CLIPDROP_API_KEY || "").trim();

  if (apiKey) {
    try {
      return await removeBackgroundWithClipdrop(imageBuffer, mimetype);
    } catch (err) {
      let errorMsg = err.message;
      const statusCode = err.response?.status;
      if (err.response?.data) {
        try {
          const errorJson = JSON.parse(Buffer.from(err.response.data).toString("utf-8"));
          errorMsg = errorJson.error || errorJson.message || errorMsg;
        } catch (e) {
          errorMsg = Buffer.from(err.response.data).toString("utf-8") || errorMsg;
        }
      }
      console.error(`[Clipdrop] API error (HTTP ${statusCode || "?"}):`, errorMsg);
      throw createServiceError(`Clipdrop API error (${statusCode || "?"}): ${errorMsg}`, 500);
    }
  }

  if (isProduction) {
    throw createServiceError("Background removal service (Clipdrop) is not configured.");
  }

  console.log("[Clipdrop] API key not provided. Running in local mock mode.");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return imageBuffer;
};


// ==================== AUTH ROUTES ====================

// START SIGNUP: validate details and email an OTP
router.post("/auth/signup/start", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid request payload format" });
    }

    const trimmedEmail = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Account with this email already exists" });
    }

    const otp = generateOtp();
    const [passwordHash, otpHash] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(otp, 10),
    ]);

    await PendingSignup.findOneAndUpdate(
      { email: trimmedEmail },
      {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: getOtpExpiry(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendSignupOtpEmail({ email: trimmedEmail, name: name.trim(), otp });
    } catch (emailError) {
      await PendingSignup.deleteOne({ email: trimmedEmail });
      throw emailError;
    }

    res.json({
      message: "Verification code sent to your email.",
      email: trimmedEmail,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("Signup start error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
});

// VERIFY SIGNUP OTP: create the account and sign the user in
router.post("/auth/signup/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    if (typeof email !== "string" || typeof otp !== "string") {
      return res.status(400).json({ message: "Invalid request payload format" });
    }

    const trimmedEmail = normalizeEmail(email);
    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return res.status(400).json({ message: "Please enter the 6-digit verification code" });
    }

    const pendingSignup = await PendingSignup.findOne({ email: trimmedEmail });
    if (!pendingSignup || pendingSignup.expiresAt.getTime() < Date.now()) {
      await PendingSignup.deleteOne({ email: trimmedEmail });
      return res.status(400).json({ message: "Verification code expired. Please request a new code." });
    }

    if (pendingSignup.attempts >= OTP_MAX_ATTEMPTS) {
      await PendingSignup.deleteOne({ email: trimmedEmail });
      return res.status(400).json({ message: "Too many incorrect attempts. Please sign up again." });
    }

    const isMatch = await bcrypt.compare(trimmedOtp, pendingSignup.otpHash);
    if (!isMatch) {
      pendingSignup.attempts += 1;
      await pendingSignup.save();
      return res.status(400).json({
        message: `Invalid verification code. ${OTP_MAX_ATTEMPTS - pendingSignup.attempts} attempts remaining.`,
      });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      await PendingSignup.deleteOne({ email: trimmedEmail });
      return res.status(400).json({ message: "Account with this email already exists" });
    }

    const newUser = new User({
      name: pendingSignup.name,
      email: pendingSignup.email,
      password: pendingSignup.passwordHash,
      emailVerified: true,
      plan: "Free",
      credits: 5,
    });

    await newUser.save();
    await PendingSignup.deleteOne({ email: trimmedEmail });
    const token = createAuthToken(newUser._id);

    res.status(201).json({
      token,
      user: serializeUser(newUser),
    });
  } catch (error) {
    console.error("Signup verify error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// RESEND SIGNUP OTP
router.post("/auth/signup/resend", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const trimmedEmail = normalizeEmail(email);
    const pendingSignup = await PendingSignup.findOne({ email: trimmedEmail });
    if (!pendingSignup) {
      return res.status(400).json({ message: "No pending signup found. Please start again." });
    }

    const secondsSinceLastSend = (Date.now() - pendingSignup.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)} seconds before requesting another code.`,
      });
    }

    const otp = generateOtp();
    pendingSignup.otpHash = await bcrypt.hash(otp, 10);
    pendingSignup.attempts = 0;
    pendingSignup.lastSentAt = new Date();
    pendingSignup.expiresAt = getOtpExpiry();
    await pendingSignup.save();

    await sendSignupOtpEmail({ email: trimmedEmail, name: pendingSignup.name, otp });

    res.json({
      message: "A new verification code has been sent.",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("Signup resend error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
});

// LOGIN
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid credentials format" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createAuthToken(user._id);

    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== USER PROFILE ====================

router.get("/user/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todayStr = getTodayDateString();
    const usage = await Usage.findOne({ userId: req.userId, date: todayStr });
    const processedToday = usage ? usage.imagesProcessed : 0;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
      },
      usage: {
        processedToday,
        dailyLimit: user.plan === "Free" ? 5 : Infinity,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== IMAGE PROCESSING PIPELINE ====================

router.post("/images/process", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todayStr = getTodayDateString();
    let todayUsage = await Usage.findOne({ userId: req.userId, date: todayStr });
    if (!todayUsage) {
      todayUsage = new Usage({ userId: req.userId, date: todayStr, imagesProcessed: 0 });
    }

    // Limit Enforcement:
    if (user.plan === "Free") {
      if (todayUsage.imagesProcessed >= 5) {
        return res.status(400).json({
          message: "Daily limit reached. You can process up to 5 images per day on the Free plan. Upgrade to Pro for unlimited daily limits!",
        });
      }
    } else {
      // Pro Plan uses credit balance
      if (user.credits <= 0) {
        return res.status(400).json({
          message: "No credits remaining. Please buy more credits in the Billing section to continue.",
        });
      }
    }

    const imageBuffer = req.file.buffer;
    const base64Original = `data:${req.file.mimetype};base64,${imageBuffer.toString("base64")}`;

    let originalImageUrl = "";
    let processedImageUrl = "";

    // Step 1: Upload original to Cloudinary
    if (hasCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(base64Original, {
          folder: "purepixels/original",
        });
        originalImageUrl = uploadResult.secure_url;
      } catch (err) {
        console.error("Cloudinary original upload failed:", err);
      }
    }

    // Fallback if Cloudinary is not configured or fails
    if (!originalImageUrl) {
      originalImageUrl = base64Original;
    }

    // Step 2: Process with local Python AI service
    const processedBuffer = await removeBackgroundBuffer(imageBuffer, req.file.mimetype);
    const base64Processed = `data:image/png;base64,${processedBuffer.toString("base64")}`;

    if (hasCloudinary) {
      const uploadProcessed = await cloudinary.uploader.upload(base64Processed, {
        folder: "purepixels/processed",
      });
      processedImageUrl = uploadProcessed.secure_url;
    } else {
      processedImageUrl = base64Processed;
    }

    // Step 3: Deduct credits/limits and save metadata
    if (user.plan === "Free") {
      todayUsage.imagesProcessed += 1;
      await todayUsage.save();
    } else {
      user.credits -= 1;
      await user.save();
    }

    const savedImage = new Image({
      userId: user._id,
      originalImageUrl,
      processedImageUrl,
    });
    await savedImage.save();

    res.json({
      id: savedImage._id,
      originalImageUrl,
      processedImageUrl,
      createdDate: savedImage.createdDate,
      creditsRemaining: user.credits,
      todayUsage: todayUsage.imagesProcessed,
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
});

// ==================== IMAGE HISTORY ====================

router.get("/images/history", requireAuth, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.userId }).sort({ createdDate: -1 });
    res.json(images);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper to extract public ID from Cloudinary URL
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    // Cloudinary URL structure: https://res.cloudinary.com/cloud_name/image/upload/v1234567/purepixels/original/filename.png
    // We want to extract 'purepixels/original/filename' (without the extension)
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1].replace(/^v\d+\//, ""); // strip the version
    const lastDotIndex = pathAfterUpload.lastIndexOf(".");
    if (lastDotIndex === -1) return pathAfterUpload;
    return pathAfterUpload.substring(0, lastDotIndex);
  } catch (e) {
    console.error("Failed to parse Cloudinary URL public id:", e);
    return null;
  }
};

router.delete("/images/delete/:id", requireAuth, async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!image) {
      return res.status(404).json({ message: "Image not found or unauthorized" });
    }

    // Try deleting from Cloudinary if configured and found
    if (hasCloudinary) {
      try {
        const originalPublicId = getCloudinaryPublicId(image.originalImageUrl);
        const processedPublicId = getCloudinaryPublicId(image.processedImageUrl);
        
        if (originalPublicId) {
          await cloudinary.uploader.destroy(originalPublicId);
          console.log(`Deleted original from Cloudinary: ${originalPublicId}`);
        }
        if (processedPublicId) {
          await cloudinary.uploader.destroy(processedPublicId);
          console.log(`Deleted processed from Cloudinary: ${processedPublicId}`);
        }
      } catch (cloudinaryErr) {
        console.error("Failed to clean up Cloudinary assets:", cloudinaryErr);
      }
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== DEVELOPER API KEYS ====================

// Middleware to authenticate using API Key
export const requireApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required. Provide API Key in 'Authorization: Bearer <KEY>' header" });
    }
    const apiKey = authHeader.split(" ")[1];
    if (!apiKey) {
      return res.status(401).json({ message: "Invalid API key format" });
    }
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ message: "Invalid or unauthorized API key" });
    }
    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "API authorization error" });
  }
};

// GET USER API KEY
router.get("/user/apikey", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ apiKey: user.apiKey || null });
  } catch (error) {
    console.error("Get API key error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GENERATE NEW API KEY
router.post("/user/apikey/generate", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate cryptographically secure API key
    const rawKey = crypto.randomBytes(24).toString("hex");
    const apiKey = `pp_sk_${rawKey}`;

    user.apiKey = apiKey;
    user.apiKeyCreated = new Date();
    await user.save();

    res.json({ apiKey });
  } catch (error) {
    console.error("Generate API key error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DEVELOPER API: REMOVE BACKGROUND (RETURNS RAW BINARY STREAM)
router.post("/v1/remove-background", requireApiKey, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = req.user;

    let todayUsage = null;

    // Limit Enforcement:
    if (user.plan === "Free") {
      const todayStr = getTodayDateString();
      todayUsage = await Usage.findOne({ userId: user._id, date: todayStr });
      if (!todayUsage) {
        todayUsage = new Usage({ userId: user._id, date: todayStr, imagesProcessed: 0 });
      }
      if (todayUsage.imagesProcessed >= 5) {
        return res.status(403).json({
          message: "Daily limit reached. You can process up to 5 images per day on the Free plan. Upgrade to Pro for unlimited daily limits!",
        });
      }
    } else {
      if (user.credits <= 0) {
        return res.status(403).json({
          message: "No credits remaining. Please buy more credits to continue.",
        });
      }
    }

    const imageBuffer = req.file.buffer;
    const base64Original = `data:${req.file.mimetype};base64,${imageBuffer.toString("base64")}`;

    let originalImageUrl = "";
    let processedImageUrl = "";
    let processedBuffer = null;

    // Step 1: Upload original to Cloudinary
    if (hasCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(base64Original, {
          folder: "purepixels/original",
        });
        originalImageUrl = uploadResult.secure_url;
      } catch (err) {
        console.error("Cloudinary original upload failed:", err);
      }
    }

    if (!originalImageUrl) {
      originalImageUrl = base64Original;
    }

    // Step 2: Process with local Python AI service
    processedBuffer = await removeBackgroundBuffer(imageBuffer, req.file.mimetype);
    const base64Processed = `data:image/png;base64,${processedBuffer.toString("base64")}`;

    if (hasCloudinary) {
      const uploadProcessed = await cloudinary.uploader.upload(base64Processed, {
        folder: "purepixels/processed",
      });
      processedImageUrl = uploadProcessed.secure_url;
    } else {
      processedImageUrl = base64Processed;
    }

    // Save image metadata
    const savedImage = new Image({
      userId: user._id,
      originalImageUrl,
      processedImageUrl,
    });
    await savedImage.save();

    if (user.plan === "Free") {
      todayUsage.imagesProcessed += 1;
      await todayUsage.save();
    } else {
      user.credits -= 1;
      await user.save();
    }

    // If we have a binary buffer, send it as response
    if (processedBuffer) {
      res.set("Content-Type", "image/png");
      res.set("Content-Disposition", `attachment; filename="purepixels_${savedImage._id}.png"`);
      return res.send(processedBuffer);
    } else {
      return res.status(500).json({ message: "Error returning binary processed image" });
    }
  } catch (error) {
    console.error("Developer API processing error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
});

// ==================== RAZORPAY BILLING PIPELINE ====================

// 1. CREATE ORDER
router.post("/payments/order", requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    let amount = 0;
    let creditsAdded = 0;

    if (planId === "monthly") {
      amount = 299; // INR 299
      creditsAdded = 100;
    } else if (planId === "yearly") {
      amount = 2999; // INR 2999
      creditsAdded = 1200;
    } else {
      return res.status(400).json({ message: "Invalid planId selected" });
    }

    const rzp = getRazorpayInstance();
    const receipt = `rp_${req.userId.slice(-6)}_${Date.now()}`;

    if (rzp) {
      const order = await rzp.orders.create({
        amount: amount * 100, // Razorpay takes amount in paise
        currency: "INR",
        receipt,
      });

      const transaction = new Transaction({
        userId: req.userId,
        orderId: order.id,
        amount,
        creditsAdded,
        status: "Pending",
      });
      await transaction.save();

      return res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      // Mock order for development/sandbox mode when Razorpay keys are not provided
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      console.log(`Razorpay keys missing. Simulating mock order creation: ${mockOrderId}`);

      const transaction = new Transaction({
        userId: req.userId,
        orderId: mockOrderId,
        amount,
        creditsAdded,
        status: "Pending",
      });
      await transaction.save();

      return res.json({
        id: mockOrderId,
        amount: amount * 100,
        currency: "INR",
        mock: true,
      });
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. VERIFY SIGNATURE
router.post("/payments/verify", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ message: "Missing order transaction details" });
    }

    const transaction = await Transaction.findOne({ orderId: razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction record not found" });
    }

    if (transaction.status === "Completed") {
      return res.status(400).json({ message: "Transaction has already been processed" });
    }

    let isVerified = false;

    if (mock) {
      if (isProduction || process.env.ALLOW_MOCK_PAYMENTS === "false") {
        return res.status(400).json({ success: false, message: "Mock payments are disabled." });
      }

      console.log("Mock Payment verified successfully in sandbox mode!");
      isVerified = true;
    } else {
      const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
      if (rzpSecret) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", rzpSecret)
          .update(body.toString())
          .digest("hex");

        isVerified = expectedSignature === razorpay_signature;
      } else {
        return res.status(503).json({ success: false, message: "Payment verification is not configured." });
      }
    }

    if (isVerified) {
      // Complete transaction and award credits to user
      transaction.status = "Completed";
      transaction.paymentId = razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
      await transaction.save();

      const user = await User.findById(req.userId);
      if (user) {
        user.credits += transaction.creditsAdded;
        user.plan = "Pro";
        await user.save();
      }

      return res.json({
        success: true,
        message: "Payment successfully verified and credits added to your balance!",
        plan: "Pro",
        credits: user ? user.credits : 0,
      });
    } else {
      transaction.status = "Failed";
      await transaction.save();
      return res.status(400).json({ success: false, message: "Payment signature verification failed." });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. PAYMENT TRANSACTION HISTORY
router.get("/payments/history", requireAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Transactions fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
