import { useSignedImages } from "@/lib/store";

export function SmartImage({
  paths,
  fallback,
  alt,
  className,
  index = 0,
  eager = false,
}: {
  paths: string[] | undefined;
  fallback: string;
  alt: string;
  className?: string;
  index?: number;
  eager?: boolean;
}) {
  const { data } = useSignedImages(paths);
  const src = data?.[index] ?? fallback;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}