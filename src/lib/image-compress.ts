/**
 * ضغط الصور تلقائياً قبل الرفع (WebP).
 * يعمل في المتصفح فقط، ويعيد الملف الأصلي عند تعذّر الضغط.
 */
export type CompressOptions = {
  maxSize?: number;
  quality?: number;
};

const SKIP = ["image/svg+xml", "image/gif"];

function canCompress(file: File) {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    file.type.startsWith("image/") &&
    !SKIP.includes(file.type)
  );
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: CanvasImageSource }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return { width: bmp.width, height: bmp.height, draw: bmp };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image load failed"));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, draw: img };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** يحوّل الصورة إلى WebP بأبعاد معقولة ويعيد ملفاً جديداً. */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxSize = 1600, quality = 0.82 } = options;
  if (!canCompress(file)) return file;
  try {
    const { width, height, draw } = await loadBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(draw, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality),
    );
    if (!blob || blob.size === 0) return file;
    // لا نستبدل الملف إذا كان الأصل أصغر فعلاً.
    if (blob.size >= file.size && file.type === "image/webp") return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** ضغط ثم تحويل إلى Data URL (للرفع عبر دوال الخادم). */
export async function compressToDataUrl(file: File, options?: CompressOptions): Promise<string> {
  const compressed = await compressImage(file, options);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
    reader.readAsDataURL(compressed);
  });
}
