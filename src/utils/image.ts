/**
 * Helper to resolve the correct image URL.
 * If the image path is a full URL (http...), it returns it as is.
 * Otherwise, it prepends the API base URL.
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return "/images/default-product.png";

  // If the path starts with http, treat it as an absolute URL
  if (imagePath.startsWith("http")) return imagePath;

  // Otherwise, prepend your API URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};
