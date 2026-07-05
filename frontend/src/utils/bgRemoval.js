// Client-side image helpers used alongside the backend's /api/bg/remove
// endpoint (ClipDrop-powered). The actual AI cutout happens server-side —
// these utilities just convert files to data URLs, composite the returned
// transparent cutout over a chosen background, and build history thumbnails.

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Composites a transparent cutout PNG over the chosen background and exports
// it in the requested format.
export async function compositeBackground(
  cutoutDataUrl,
  { type = "transparent", color = "#ffffff", imageDataUrl = null, format = "png", width, height } = {}
) {
  const img = await loadImage(cutoutDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width || img.width;
  canvas.height = height || img.height;
  const ctx = canvas.getContext("2d");

  if (type === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === "color") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === "image" && imageDataUrl) {
    const bgImg = await loadImage(imageDataUrl);
    const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
    const sw = bgImg.width * scale;
    const sh = bgImg.height * scale;
    ctx.drawImage(bgImg, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
  }
  // "transparent" leaves the canvas blank (alpha 0).

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const mime = format === "jpg" || format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";

  if (mime === "image/jpeg" && type === "transparent") {
    // JPEG has no alpha channel — flatten onto white so it isn't black.
    const flattened = document.createElement("canvas");
    flattened.width = canvas.width;
    flattened.height = canvas.height;
    const fctx = flattened.getContext("2d");
    fctx.fillStyle = "#ffffff";
    fctx.fillRect(0, 0, flattened.width, flattened.height);
    fctx.drawImage(canvas, 0, 0);
    return flattened.toDataURL(mime, 0.92);
  }

  return canvas.toDataURL(mime, 0.92);
}

// Downscales a data URL for cheap storage (history thumbnails).
export async function toThumbnail(dataUrl, maxDim = 480, quality = 0.82) {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const isPng = dataUrl.startsWith("data:image/png");
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
}
