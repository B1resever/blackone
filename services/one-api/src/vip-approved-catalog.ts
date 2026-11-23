/**
 * B1 VIP authorized catalog data. Customer-facing copy is English by default.
 * Spanish is a localization option. Pricing requires a verified commercial rate.
 * Media paths identify photographs supplied by the fleet owner.
 * This module does not replace the existing ONE vehicle catalog.
 */
import hourlyRates from "../../../config/b1-vip-hourly-rates.json" with { type: "json" };

export type VipMediaSlot =
  | "exterior" | "door_open" | "cabin" | "seat_detail" | "rear_exterior";
export interface VipCatalogEntry {
  id: "maybach-tifanni" | "desert-sand" | "cadillac-escalade";
  displayName: string;
  exteriorColor: "black";
  passengerCapacity: number | null;
  descriptionEn: string;
  featuresEn: readonly string[];
  priority: number;
  mediaSlots: readonly VipMediaSlot[];
  doorPresentation: "open_for_cabin" | "closed_only";
  bookingMode: "hourly";
  hourlyPricing: (typeof hourlyRates.vehicles)[keyof typeof hourlyRates.vehicles];
  verifiedMedia: readonly string[];
  illustrativeMedia?: readonly string[];
}
export const VIP_FLEET: readonly VipCatalogEntry[] = [
  {
    id: "maybach-tifanni",
    displayName: "Maybach Tifanni",
    exteriorColor: "black",
    passengerCapacity: 10,
    descriptionEn: "Mercedes Sprinter Maybach Style. Nine guests in the rear VIP cabin and one beside the chauffeur.",
    featuresEn: ["Turquoise VIP cabin", "Premium turquoise leather", "Black marble floor", "Embroidered Maybach emblems", "Integrated Apple TV", "Ambient lighting", "Individual climate control", "Audio system", "Full privacy", "Onboard Wi-Fi"],
    priority: 1,
    mediaSlots: ["exterior", "door_open", "cabin", "seat_detail", "rear_exterior"],
    doorPresentation: "open_for_cabin",
    bookingMode: "hourly",
    hourlyPricing: hourlyRates.vehicles["maybach-tifanni"],
    verifiedMedia: [
      "/images/vip/maybach-tifanni/exterior.webp",
      "/images/vip/maybach-tifanni/cabin.webp",
      "/images/vip/maybach-tifanni/seat.webp",
      "/images/vip/maybach-tifanni/tables.webp",
      "/images/vip/maybach-tifanni/rear.webp",
    ],
    illustrativeMedia: ["/images/vip/maybach-tifanni/door-illustration.webp"],
  },
  {
    id: "desert-sand",
    displayName: "Desert Sand",
    exteriorColor: "black",
    passengerCapacity: 15,
    descriptionEn: "Luxury Sprinter with a cream-colored cabin. Full kitchen on board, as described by the fleet owner.",
    featuresEn: ["Cream-colored cabin", "Full kitchen on board"],
    priority: 2,
    mediaSlots: ["exterior", "door_open", "cabin", "seat_detail", "rear_exterior"],
    doorPresentation: "open_for_cabin",
    bookingMode: "hourly",
    hourlyPricing: hourlyRates.vehicles["desert-sand"],
    verifiedMedia: [
      "/images/vip/desert-sand/exterior.webp",
      "/images/vip/desert-sand/door.webp",
      "/images/vip/desert-sand/entry.webp",
      "/images/vip/desert-sand/seat.webp",
      "/images/vip/desert-sand/cabin.webp",
    ],
  },
  {
    id: "cadillac-escalade",
    displayName: "Cadillac Escalade",
    exteriorColor: "black",
    passengerCapacity: null,
    descriptionEn: "Private luxury transportation.",
    featuresEn: [],
    priority: 3,
    mediaSlots: ["exterior"],
    doorPresentation: "closed_only",
    bookingMode: "hourly",
    hourlyPricing: hourlyRates.vehicles["cadillac-escalade"],
    verifiedMedia: [],
  },
] as const;

export const VIP_BRAND_RULES = {
  preserveOriginalLogo: true,
  languageDefault: "en",
  languages: ["en", "es"],
  heroPriority: "maybach-tifanni",
  publicTheme: "approved Tiffany turquoise, ivory, restrained orange",
  customerFacingAiBranding: false,
  exclude: ["aircraft", "yachts", "quinceanera stock imagery", "event stock imagery", "invented fleet photos"],
} as const;
