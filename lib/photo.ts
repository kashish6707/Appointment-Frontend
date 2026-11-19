// Doctor photos are cropped to a centred square and shrunk in the browser before upload, so a
// 6 MB phone camera photo becomes a ~100 KB JPEG. The backend still checks the bytes itself.

const SIZE = 600;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

export class PhotoError extends Error {}

/** Read an image file and return a square JPEG data URL (600 × 600). */
export async function squarePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new PhotoError("not-image");
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError("too-big");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new PhotoError("unreadable"));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (side < 200) throw new PhotoError("too-small");
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError("unreadable");
    ctx.fillStyle = "#FFFFFF"; // transparent PNGs get a white background
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// --- prescriptions and reports -----------------------------------------------------------

const MAX_RECORD_BYTES = 5 * 1024 * 1024;
const RECORD_LONG_SIDE = 2000; // still sharp enough to read small print

/**
 * A prescription or report file as a data URL for upload. Photos are shrunk to at most
 * 2000 px on the long side (a phone photo of a page stays readable at ~400 KB); PDFs are sent as
 * they are, up to 5 MB.
 */
export async function recordFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    if (file.size > MAX_RECORD_BYTES) throw new PhotoError("too-big");
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new PhotoError("unreadable"));
      r.readAsDataURL(file);
    });
  }
  if (!file.type.startsWith("image/")) throw new PhotoError("not-image");
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError("too-big");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new PhotoError("unreadable"));
      i.src = url;
    });
    const scale = Math.min(1, RECORD_LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError("unreadable");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.85);
    if (data.length * 0.75 > MAX_RECORD_BYTES) throw new PhotoError("too-big");
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
