import { format, parseISO } from "date-fns";

// Helper to format 9876543211 -> +7 (987) 654 32-11
export const formatMobile = (mobile: string) => {
  // Remove non-digit characters just in case
  const clean = mobile.replace(/\D/g, "");

  // Check if it's a valid length (usually 10 digits for RU mobile without country code)
  // If user stored full 11 digits starting with 7 or 8, handle accordingly
  let body = clean;
  if (clean.length === 11) {
    body = clean.substring(1); // Remove leading 7 or 8
  }

  if (body.length === 10) {
    return `+7 (${body.substring(0, 3)}) ${body.substring(3, 6)} ${body.substring(6, 8)}-${body.substring(8, 10)}`;
  }

  // Fallback if format is unexpected
  return mobile;
};

/**
 * Converts an ISO date string to "dd/MM/yyyy" format.
 * @param dateStr - The ISO date string (e.g. "2026-02-14T08:24:00.992Z")
 * @returns The formatted date string (e.g. "14/02/2026") or an empty string if invalid.
 */
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "";

  try {
    // parseISO is recommended over new Date() for ISO strings in date-fns
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
