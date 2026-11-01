// Operational city centers chosen by B1. Radius is geographic, not road mileage.
// No intercity or out-of-coverage price is invented from the local fare.
const areas = [
  { id: 'brickell-miami', center: { latitude: 25.768282, longitude: -80.193328 }, radiusMiles: 10 },
  { id: 'miami-beach', center: { latitude: 25.79065, longitude: -80.13005 }, radiusMiles: 10 },
  { id: 'fort-lauderdale', center: { latitude: 26.12244, longitude: -80.13732 }, radiusMiles: 10 },
  { id: 'west-palm-beach', center: { latitude: 26.71534, longitude: -80.05337 }, radiusMiles: 10 },
];

export const southFloridaPricing = {
  version: 'south-florida-local-2026-11-01', marketId: 'south-florida', currency: 'USD',
  effectiveFrom: '2026-11-01T00:00:00-04:00', effectiveTo: '2027-11-01T00:00:00-04:00',
  areas,
  rates: areas.flatMap(area => [
    { pickupAreaId: area.id, dropoffAreaId: area.id, vehicleClass: 'xl',
      minimumMinor: 12800, baseMinor: 12800, perMileMinor: 0, perMinuteMinor: 0 },
    { pickupAreaId: area.id, dropoffAreaId: area.id, vehicleClass: 'suv-black',
      minimumMinor: 14720, baseMinor: 14720, perMileMinor: 0, perMinuteMinor: 0 },
  ]),
  // Only verified dates are activated. Future annual dates must be reconfirmed.
  adjustments: [{ id: 'miami-art-week-2026', startsAt: '2026-11-30T00:00:00-05:00',
    endsAt: '2026-12-07T00:00:00-05:00', areaIds: ['brickell-miami', 'miami-beach'], multiplierBps: 15000 }],
};
