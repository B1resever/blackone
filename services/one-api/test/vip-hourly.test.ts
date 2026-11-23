import assert from "node:assert/strict";
import test from "node:test";
import rates from "../../../config/b1-vip-hourly-rates.json" with { type: "json" };
import {
  quoteVipHourly,
  validateVipOfferAcceptance,
  type VipHourlyVehicle,
  type VipHourlyRequest,
} from "../src/vip-hourly.js";

const vehicle: VipHourlyVehicle = {
  id: "vip-1", name: "Test VIP", currency: "USD",
  hourlyRateCents: 20000, minimumHours: 3, maximumPassengers: 6, active: true,
};
const request: VipHourlyRequest = {
  vehicleId: "vip-1", pickupAt: "2026-12-01T15:00:00Z",
  pickupAddress: "Miami, FL", durationHours: 3, passengers: 4,
};
test("VIP hourly quote is exact in integer cents", () => {
  assert.equal(quoteVipHourly(vehicle, request).totalCents, 60000);
});
test("VIP packages cover the first three hours and bill additional hours at the vehicle rate", () => {
  for (const [vehicleId, pricing] of Object.entries(rates.vehicles)) {
    const quotedVehicle = {
      ...vehicle, id: vehicleId, minimumHours: rates.minimumHours,
      hourlyRateCents: pricing.additionalHourCents,
      minimumPackageCents: pricing.minimumPackageCents,
      gratuityBasisPoints: pricing.gratuityBasisPoints,
    };
    const packageQuote = quoteVipHourly(quotedVehicle, { ...request, vehicleId });
    const extraHourQuote = quoteVipHourly(quotedVehicle, { ...request, vehicleId, durationHours: 4 });
    const isEscalade = vehicleId === "cadillac-escalade";
    assert.equal(packageQuote.subtotalCents, isEscalade ? 60000 : 100000);
    assert.equal(packageQuote.gratuityCents, isEscalade ? 9000 : 15000);
    assert.equal(packageQuote.totalCents, isEscalade ? 69000 : 115000);
    assert.equal(packageQuote.securityHoldCents, packageQuote.subtotalCents);
    assert.equal(extraHourQuote.subtotalCents, isEscalade ? 86000 : 140000);
  }
});
test("VIP quote rejects shorter-than-minimum bookings", () => {
  assert.throws(() => quoteVipHourly(vehicle, {...request, durationHours: 2}), /VIP_DURATION_INVALID/);
});
test("VIP quote rejects overcapacity", () => {
  assert.throws(() => quoteVipHourly(vehicle, {...request, passengers: 7}), /VIP_PASSENGERS_INVALID/);
});
test("VIP quote rejects unavailable vehicle", () => {
  assert.throws(() => quoteVipHourly({...vehicle, active: false}, request), /VIP_VEHICLE_UNAVAILABLE/);
});
test("VIP dispatch offer rejects ineligible driver", () => {
  assert.throws(() => validateVipOfferAcceptance({
    bookingId:"b", driverId:"d", eligible:false, expiresAt:"2026-12-01T15:00:00Z"
  }, "dispatching", "2026-12-01T14:00:00Z"), /VIP_DRIVER_NOT_ELIGIBLE/);
});
test("VIP dispatch offer rejects expired offer", () => {
  assert.throws(() => validateVipOfferAcceptance({
    bookingId:"b", driverId:"d", eligible:true, expiresAt:"2026-12-01T15:00:00Z"
  }, "dispatching", "2026-12-01T15:01:00Z"), /VIP_OFFER_EXPIRED/);
});
test("VIP dispatch offer accepts eligible, timely offer for dispatching booking", () => {
  assert.doesNotThrow(() => validateVipOfferAcceptance({
    bookingId:"b", driverId:"d", eligible:true, expiresAt:"2026-12-01T15:00:00Z"
  }, "dispatching", "2026-12-01T14:00:00Z"));
});
