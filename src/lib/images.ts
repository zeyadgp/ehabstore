import catSkincare from "@/assets/cat-skincare.jpg";
import catHaircare from "@/assets/cat-haircare.jpg";
import catMakeup from "@/assets/cat-makeup.jpg";
import catPerfumes from "@/assets/cat-perfumes.jpg";
import catBodycare from "@/assets/cat-bodycare.jpg";
import catOffers from "@/assets/cat-offers.jpg";
import catDevices from "@/assets/cat-devices.jpg";

export const categoryFallback: Record<string, string> = {
  skincare: catSkincare,
  haircare: catHaircare,
  makeup: catMakeup,
  perfumes: catPerfumes,
  bodycare: catBodycare,
  offers: catOffers,
  devices: catDevices,
};

/** Sub-categories inherit the visual identity of their parent tile. */
export const subCategoryFallback: Record<string, string> = {
  "skincare-": catSkincare,
  "haircare-": catHaircare,
  "makeup-": catMakeup,
  "perfumes-": catPerfumes,
  "devices-": catDevices,
};

export const defaultProductImage = catSkincare;

export function fallbackFor(slug?: string | null) {
  if (slug && categoryFallback[slug]) return categoryFallback[slug];
  if (slug) {
    const hit = Object.keys(subCategoryFallback).find((p) => slug.startsWith(p));
    if (hit) return subCategoryFallback[hit] as string;
  }
  return defaultProductImage;
}