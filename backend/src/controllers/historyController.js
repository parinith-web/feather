import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { HistoryItem } from "../models/HistoryItem.js";
import {
  uploadHistoryImage,
  toThumbnailUrl,
  deleteCloudinaryAsset,
  deleteAllUserHistoryAssets,
} from "../services/cloudinaryService.js";

function serializeHistoryItem(doc) {
  return {
    id: doc._id.toString(),
    createdAt: doc.createdAt,
    filename: doc.filename,
    format: doc.format,
    bgType: doc.bgType,
    bgColor: doc.bgColor,
    resultFull: doc.resultUrl,
    resultThumb: toThumbnailUrl(doc.resultUrl),
    bgImageThumb: doc.bgImageThumbUrl,
  };
}

// POST /api/history
// Body: { filename, format, bgType, bgColor, resultFull (data URL), bgImageThumb? (data URL) }
// Called by the frontend right after it locally composites the final image
// (background swap + format conversion) from the /api/bg/remove cutout.
export const createHistoryItem = asyncHandler(async (req, res) => {
  const { filename, format, bgType, bgColor, resultFull, bgImageThumb } = req.body || {};

  if (!resultFull || typeof resultFull !== "string" || !resultFull.startsWith("data:image/")) {
    throw new ApiError(400, "resultFull must be a base64 image data URL.");
  }
  if (!filename) {
    throw new ApiError(400, "filename is required.");
  }

  const user = req.dbUser;

  const uploaded = await uploadHistoryImage(resultFull, {
    firebaseUid: user.firebaseUid,
    publicIdSuffix: "result",
  });

  let bgThumb = null;
  if (bgImageThumb && typeof bgImageThumb === "string" && bgImageThumb.startsWith("data:image/")) {
    bgThumb = await uploadHistoryImage(bgImageThumb, {
      firebaseUid: user.firebaseUid,
      publicIdSuffix: "bgthumb",
    });
  }

  const doc = await HistoryItem.create({
    user: user._id,
    firebaseUid: user.firebaseUid,
    filename,
    format: format || "png",
    bgType: bgType || "transparent",
    bgColor: bgColor || "#ffffff",
    resultUrl: uploaded.url,
    resultPublicId: uploaded.publicId,
    bgImageThumbUrl: bgThumb?.url || null,
    bgImageThumbPublicId: bgThumb?.publicId || null,
  });

  res.status(201).json({ item: serializeHistoryItem(doc) });
});

// GET /api/history
export const listHistory = asyncHandler(async (req, res) => {
  const items = await HistoryItem.find({ firebaseUid: req.dbUser.firebaseUid }).sort({ createdAt: -1 }).limit(200);

  res.json({ items: items.map(serializeHistoryItem) });
});

// DELETE /api/history/:id
export const deleteHistoryItemById = asyncHandler(async (req, res) => {
  const doc = await HistoryItem.findOne({ _id: req.params.id, firebaseUid: req.dbUser.firebaseUid });
  if (!doc) throw new ApiError(404, "History item not found.");

  await deleteCloudinaryAsset(doc.resultPublicId);
  if (doc.bgImageThumbPublicId) await deleteCloudinaryAsset(doc.bgImageThumbPublicId);
  await doc.deleteOne();

  res.json({ deleted: true, id: req.params.id });
});

// DELETE /api/history
export const clearHistory = asyncHandler(async (req, res) => {
  const firebaseUid = req.dbUser.firebaseUid;
  await deleteAllUserHistoryAssets(firebaseUid);
  await HistoryItem.deleteMany({ firebaseUid });
  res.json({ cleared: true });
});
