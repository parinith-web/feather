import axios from "axios";
import FormData from "form-data";
import { ApiError } from "../utils/ApiError.js";

/**
 * Sends an image buffer to the ClipDrop "Remove Background" API and returns
 * the resulting transparent-background PNG as a Buffer.
 *
 * Docs: https://clipdrop.co/apis/docs/remove-background
 */
export async function removeBackgroundWithClipdrop(fileBuffer, originalFilename = "image.png") {
  const apiKey = process.env.CLIPDROP_API_KEY;
  const endpoint = process.env.CLIPDROP_ENDPOINT || "https://clipdrop-api.co/remove-background/v1";

  if (!apiKey) {
    throw new ApiError(500, "Server is missing CLIPDROP_API_KEY configuration.");
  }

  const form = new FormData();
  form.append("image_file", fileBuffer, { filename: originalFilename });

  try {
    const response = await axios.post(endpoint, form, {
      headers: {
        ...form.getHeaders(),
        "x-api-key": apiKey,
      },
      responseType: "arraybuffer",
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return Buffer.from(response.data);
  } catch (err) {
    if (err.response) {
      // ClipDrop returns JSON error bodies even though we asked for arraybuffer.
      let message = "ClipDrop background removal failed.";
      try {
        const parsed = JSON.parse(Buffer.from(err.response.data).toString("utf8"));
        message = parsed.error || message;
      } catch {
        // ignore parse failure, use default message
      }
      throw new ApiError(err.response.status === 429 ? 429 : 502, message);
    }
    throw new ApiError(502, "Could not reach the ClipDrop API.");
  }
}
