export const AREAS = [
  "Jinnah Road",
  "Liaqat Bazaar",
  "Model Town",
  "Satellite Town",
  "Zarghoon Road",
  "Shahrah-e-Iqbal (Kandahari Bazaar)",
  "Quetta Cantt",
  "Samungli Road",
  "Airport Road",
  "Brewery Road",
  "Nawan Killi / Chaman Phatak",
] as const;

export type QuettaArea = (typeof AREAS)[number];

export const CATEGORIES = [
  { id: "ALL", label: "All", short: "All" },
  { id: "GENTS", label: "Men's Salons", short: "Gents" },
  { id: "LADIES", label: "Ladies Parlors", short: "Ladies" },
  { id: "UNISEX", label: "Spas", short: "Spas" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  GENTS: "Gents Salon & Barber",
  LADIES: "Ladies Beauty Parlour",
  UNISEX: "Unisex & Luxury Spa",
};

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const LIKE_TAGS = ["Hygiene", "Staff", "Punctual", "Ambience", "Value for money", "Bridal finish"] as const;
export const DISLIKE_TAGS = ["Wait time", "Price", "Quality", "Location", "Booking mix-up"] as const;

export const PRICE_MIN = 300;
export const PRICE_MAX = 50000;

export const BRAND = {
  name: "Quetta Salon Connect",
  short: "Q-Salons",
  urdu: "سلونز آف کوئٹہ",
  city: "Quetta, Balochistan",
  tagline: "Book the Best Salons & Parlors in Quetta Online",
};
