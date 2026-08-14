export function productUrl(slug: string) {
  if (typeof window === "undefined") return `/product/${slug}`;
  return `${window.location.origin}/product/${slug}`;
}

/** Native share when available, clipboard copy otherwise. Returns the action taken. */
export async function shareProduct(name: string, slug: string): Promise<"shared" | "copied" | "failed"> {
  const url = productUrl(slug);
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: name, text: name, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "shared";
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      return "failed";
    }
  }
}
