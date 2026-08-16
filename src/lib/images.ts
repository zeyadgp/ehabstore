import brandSkincare from "@/assets/brand-skincare.png";
import brandHaircare from "@/assets/brand-haircare.png";
import brandMakeup from "@/assets/brand-makeup.png";
import brandPerfumes from "@/assets/brand-perfumes.png";
import brandDevices from "@/assets/brand-devices.png";
import catBodycare from "@/assets/cat-bodycare.jpg";
import catOffers from "@/assets/cat-offers.jpg";

export const categoryFallback: Record<string, string> = {
  skincare: brandSkincare,
  haircare: brandHaircare,
  makeup: brandMakeup,
  perfumes: brandPerfumes,
  bodycare: catBodycare,
  offers: catOffers,
  devices: brandDevices,
};

/** Sub-categories inherit the visual identity of their parent tile. */
export const subCategoryFallback: Record<string, string> = {
  "skincare-": brandSkincare,
  "haircare-": brandHaircare,
  "makeup-": brandMakeup,
  "perfumes-": brandPerfumes,
  "devices-": brandDevices,
};

export const defaultProductImage = brandSkincare;

export function fallbackFor(slug?: string | null) {
  if (slug && categoryFallback[slug]) return categoryFallback[slug];
  if (slug) {
    const hit = Object.keys(subCategoryFallback).find((p) => slug.startsWith(p));
    if (hit) return subCategoryFallback[hit] as string;
  }
  return defaultProductImage;
}
