/**
 * B1 VIP hourly booking domain — isolated from existing ONE trip flows.
 * No external provider calls, no live charges and no driver messaging here.
 */
export type VipBookingStatus =
  | "requested" | "quoted" | "dispatching" | "assigned"
  | "in_progress" | "completed" | "cancelled" | "unassigned";

export interface VipHourlyVehicle {
  id: string;
  name: string;
  currency: "USD";
  hourlyRateCents: number;
  minimumHours: number;
  maximumPassengers: number;
  active: boolean;
}

export interface VipHourlyRequest {
  vehicleId: string;
  pickupAt: string;
  pickupAddress: string;
  durationHours: number;
  passengers: number;
}

export interface VipHourlyQuote {
  vehicleId: string;
  currency: "USD";
  durationHours: number;
  hourlyRateCents: number;
  totalCents: number;
  minimumHours: number;
}

export function quoteVipHourly(
  vehicle: VipHourlyVehicle,
  request: VipHourlyRequest,
): VipHourlyQuote {
  if (!vehicle.active || vehicle.id !== request.vehicleId) {
    throw new Error("VIP_VEHICLE_UNAVAILABLE");
  }
  if (!Number.isSafeInteger(vehicle.hourlyRateCents) || vehicle.hourlyRateCents <= 0) {
    throw new Error("VIP_RATE_INVALID");
  }
  if (!Number.isSafeInteger(vehicle.minimumHours) || vehicle.minimumHours < 1) {
    throw new Error("VIP_MINIMUM_INVALID");
  }
  if (!Number.isSafeInteger(vehicle.maximumPassengers) || vehicle.maximumPassengers < 1) {
    throw new Error("VIP_CAPACITY_INVALID");
  }
  if (!Number.isSafeInteger(request.durationHours) ||
      request.durationHours < vehicle.minimumHours) {
    throw new Error("VIP_DURATION_INVALID");
  }
  if (!Number.isSafeInteger(request.passengers) || request.passengers < 1 ||
      request.passengers > vehicle.maximumPassengers) {
    throw new Error("VIP_PASSENGERS_INVALID");
  }
  if (!request.pickupAddress.trim() || !Number.isFinite(Date.parse(request.pickupAt))) {
    throw new Error("VIP_PICKUP_INVALID");
  }
  const totalCents = vehicle.hourlyRateCents * request.durationHours;
  if (!Number.isSafeInteger(totalCents)) throw new Error("VIP_TOTAL_OVERFLOW");
  return {
    vehicleId: vehicle.id,
    currency: vehicle.currency,
    durationHours: request.durationHours,
    hourlyRateCents: vehicle.hourlyRateCents,
    minimumHours: vehicle.minimumHours,
    totalCents,
  };
}

export interface VipDriverOffer {
  bookingId: string;
  driverId: string;
  expiresAt: string;
  eligible: boolean;
}

export function validateVipOfferAcceptance(
  offer: VipDriverOffer,
  bookingStatus: VipBookingStatus,
  acceptedAt: string,
): void {
  if (bookingStatus !== "dispatching") throw new Error("VIP_BOOKING_NOT_DISPATCHING");
  if (!offer.eligible) throw new Error("VIP_DRIVER_NOT_ELIGIBLE");
  const expiry = Date.parse(offer.expiresAt);
  const accepted = Date.parse(acceptedAt);
  if (!Number.isFinite(expiry) || !Number.isFinite(accepted) || accepted > expiry) {
    throw new Error("VIP_OFFER_EXPIRED");
  }
}

/**
 * IMPORTANT: the winning acceptance MUST be persisted in one atomic database
 * UPDATE/transaction with WHERE booking.status='dispatching' AND assigned_driver_id IS NULL.
 * This validator alone does not guarantee first-accept-wins under concurrency.
 */
