import mongoose from "mongoose";

const { Schema } = mongoose;

// Tracks how many images a user has processed on a given calendar day (UTC
// day-key, e.g. "2026-07-06"). Reset is implicit: a new day-key just starts
// a fresh counter, mirroring the frontend's old localStorage usageStore.
const UsageSchema = new Schema(
  {
    day: { type: String, default: "" },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    photoURL: { type: String, default: "" },

    plan: { type: String, enum: ["free", "pro"], default: "free", index: true },
    proSince: { type: Date, default: null },

    // Paddle references, populated once the user completes checkout.
    paddleCustomerId: { type: String, default: null },
    paddleTransactionId: { type: String, default: null },
    paddleSubscriptionId: { type: String, default: null },

    usage: { type: UsageSchema, default: () => ({ day: "", count: 0 }) },

    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
