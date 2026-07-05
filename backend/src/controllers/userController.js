import { asyncHandler } from "../utils/asyncHandler.js";
import { HistoryItem } from "../models/HistoryItem.js";
import { getUsageSnapshot, msUntilMidnightUTC } from "../services/usageService.js";
import { serializeUser } from "./authController.js";

// GET /api/user/me
export const getMe = asyncHandler(async (req, res) => {
  const user = req.dbUser;
  const historyCount = await HistoryItem.countDocuments({ firebaseUid: user.firebaseUid });

  res.json({
    user: serializeUser(user, {
      historyCount,
      usageResetsInMs: msUntilMidnightUTC(),
    }),
  });
});

// GET /api/user/usage
export const getUsage = asyncHandler(async (req, res) => {
  res.json({
    usage: getUsageSnapshot(req.dbUser),
    resetsInMs: msUntilMidnightUTC(),
  });
});
