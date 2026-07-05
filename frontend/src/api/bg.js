import api from "./client";

// Sends the raw image file to the backend, which forwards it to ClipDrop and
// returns the transparent-background cutout as a base64 PNG data URL. The
// frontend keeps doing its existing client-side compositing (background
// color/image swap, format conversion, thumbnailing) against this cutout.
export async function removeBackground(file) {
  const form = new FormData();
  form.append("image", file);

  const { data } = await api.post("/bg/remove", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data; // { image, mimeType, usage }
}
