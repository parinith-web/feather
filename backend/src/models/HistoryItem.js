import mongoose from "mongoose";

const { Schema } = mongoose;

const HistoryItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    firebaseUid: { type: String, required: true, index: true },

    filename: { type: String, required: true },
    format: { type: String, enum: ["png", "jpg", "webp"], default: "png" },
    bgType: { type: String, enum: ["transparent", "white", "color", "image"], default: "transparent" },
    bgColor: { type: String, default: "#ffffff" },

    // Cloudinary-hosted assets.
    resultUrl: { type: String, required: true }, // full-resolution processed image
    resultPublicId: { type: String, required: true },
    bgImageThumbUrl: { type: String, default: null }, // thumbnail of custom bg image, if any
    bgImageThumbPublicId: { type: String, default: null },
  },
  { timestamps: true }
);

export const HistoryItem = mongoose.model("HistoryItem", HistoryItemSchema);
