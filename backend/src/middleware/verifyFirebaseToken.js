import { admin } from "../config/firebase.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

// Verifies the Firebase ID token sent by the frontend (Authorization: Bearer <token>,
// obtained on the client via `await auth.currentUser.getIdToken()`), then attaches
// `req.firebaseUser` (raw decoded token) and `req.dbUser` (Mongo document) to the request.
export const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Missing or malformed Authorization header. Expected 'Bearer <idToken>'.");
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired authentication token.");
  }

  req.firebaseUser = decoded;

  const dbUser = await User.findOne({ firebaseUid: decoded.uid });
  if (!dbUser) {
    // The client should call POST /api/auth/sync right after sign-in before
    // hitting any other authenticated route, so this should be rare.
    throw new ApiError(404, "User profile not found. Call /api/auth/sync first.");
  }

  req.dbUser = dbUser;
  next();
});
