import { cloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const HISTORY_FOLDER = process.env.CLOUDINARY_HISTORY_FOLDER || "snapcut/history";

function uploadBufferOrDataUrl(source, options) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(source)) {
      const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      stream.end(source);
    } else {
      // Assume it's a data URL / remote URL string — Cloudinary accepts these directly.
      cloudinary.uploader.upload(source, options).then(resolve).catch(reject);
    }
  });
}

/**
 * Uploads a processed result image (Buffer or base64 data URL) for a given
 * user into their history folder.
 */
export async function uploadHistoryImage(source, { firebaseUid, publicIdSuffix = "result" } = {}) {
  try {
    const result = await uploadBufferOrDataUrl(source, {
      folder: `${HISTORY_FOLDER}/${firebaseUid}`,
      public_id: `${publicIdSuffix}-${Date.now()}`,
      resource_type: "image",
      overwrite: false,
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    throw new ApiError(502, "Failed to upload image to Cloudinary.", err.message);
  }
}

/** Builds an on-the-fly Cloudinary thumbnail URL from a full-size image URL. */
export function toThumbnailUrl(secureUrl, { width = 480 } = {}) {
  if (!secureUrl) return null;
  return secureUrl.replace("/upload/", `/upload/c_limit,w_${width},q_auto,f_auto/`);
}

export async function deleteCloudinaryAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    // Log and continue — a failed remote cleanup shouldn't block the user's
    // local delete action from succeeding.
    console.error(`[cloudinary] failed to delete ${publicId}:`, err.message);
  }
}

export async function deleteAllUserHistoryAssets(firebaseUid) {
  try {
    await cloudinary.api.delete_resources_by_prefix(`${HISTORY_FOLDER}/${firebaseUid}/`);
  } catch (err) {
    console.error(`[cloudinary] failed to bulk-delete for ${firebaseUid}:`, err.message);
  }
}
