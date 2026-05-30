import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  plan: { type: String, default: "Free" },
  credits: { type: Number, default: 5 }, // users start with 5 welcome credits/images
  apiKey: { type: String, unique: true, sparse: true },
  apiKeyCreated: { type: Date },
  createdDate: { type: Date, default: Date.now },
});

const ImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalImageUrl: { type: String, required: true },
  processedImageUrl: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String },
  amount: { type: Number, required: true },
  creditsAdded: { type: Number, required: true },
  status: { type: String, default: "Pending" }, // 'Pending', 'Completed', 'Failed'
  date: { type: Date, default: Date.now },
});

const UsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  imagesProcessed: { type: Number, default: 0 },
});

const PendingSignupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdDate: { type: Date, default: Date.now },
});

// Avoid re-compilation in development HMR if applicable
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export const Usage = mongoose.models.Usage || mongoose.model("Usage", UsageSchema);
export const PendingSignup = mongoose.models.PendingSignup || mongoose.model("PendingSignup", PendingSignupSchema);
