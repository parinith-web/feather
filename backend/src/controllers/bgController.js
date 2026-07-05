import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { removeBackgroundWithClipdrop } from "../services/clipdropService.js";
import { rolloverUsageIfNeeded, getUsageSnapshot, FREE_DAILY_LIMIT } from "../services/usageService.js";

// POST /api/bg/remove
// multipart/form-data with field "image". Requires auth.
// Enforces the free-plan daily quota; Pro users are unlimited.
// Returns the cutout as a base64 PNG data URL — the frontend keeps doing its
// existing client-side compositing (background color/image swap, format
// conversion, thumbnailing) against this cutout, exactly like the old
// simulated `cutoutForeground` used to produce.
export const removeBackground = asyncHandler(async (req, res) => {
  const user = req.dbUser;

  if (!req.file) {
    throw new ApiError(400, "No image file uploaded. Attach it under the 'image' field.");
  }

  rolloverUsageIfNeeded(user);

  const isPro = user.plan === "pro";
  if (!isPro && user.usage.count >= FREE_DAILY_LIMIT) {
    throw new ApiError(429, "Daily limit reached. Upgrade to Pro or try again after midnight UTC.");
  }

  const resultBuffer = await removeBackgroundWithClipdrop(req.file.buffer, req.file.originalname);

  user.usage.count += 1;
  await user.save();

  const dataUrl = `data:image/png;base64,${resultBuffer.toString("base64")}`;

  res.json({
    image: dataUrl,
    mimeType: "image/png",
    usage: getUsageSnapshot(user),
  });
});
