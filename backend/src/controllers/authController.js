import { asyncHandler } from "../utils/asyncHandler.js";
import { admin } from "../config/firebase.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { rolloverUsageIfNeeded, getUsageSnapshot } from "../services/usageService.js";
import { HistoryItem } from "../models/HistoryItem.js";

function serializeUser(user, extra = {}) {
  return {
    uid: user.firebaseUid,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
    plan: user.plan,
    proSince: user.proSince,
    memberSince: user.createdAt,
    usage: getUsageSnapshot(user),
    ...extra,
  };
}

// POST /api/auth/sync
// Called right after Firebase sign-in on the client. Verifies the ID token,
// then creates the Mongo user record on first login or refreshes cached
// profile fields (name/photo/email) on subsequent logins.
export const syncUser = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Missing or malformed Authorization header.");
  }

  const decoded = await admin.auth().verifyIdToken(token);

  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      photoURL: decoded.picture || "",
      plan: "free",
      usage: { day: "", count: 0 },
      lastLoginAt: new Date(),
    });
  } else {
    user.email = decoded.email || user.email;
    user.name = decoded.name || user.name;
    user.photoURL = decoded.picture || user.photoURL;
    user.lastLoginAt = new Date();
    rolloverUsageIfNeeded(user);
    await user.save();
  }

  const historyCount = await HistoryItem.countDocuments({ firebaseUid: user.firebaseUid });

  res.json({ user: serializeUser(user, { historyCount }) });
});

export { serializeUser };
