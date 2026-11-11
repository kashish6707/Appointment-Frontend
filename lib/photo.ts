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
