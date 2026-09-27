export type RideType = "point_to_point" | "airport" | "hourly" | "event";

export type QuoteInput = {
  rideType: RideType;
  distanceMiles: number;
  durationMinutes: number;
  tolls?: number;
  hourlyHours?: number;
};

export type Quote = {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  tolls: number;
  serviceFee: number;
  subtotal: number;
  customerTotal: number;
  estimatedDriverPay: number;
  estimatedB1Gross: number;
};

const money = (value: number) => Math.round(value * 100) / 100;

export function calculateQuote(input: QuoteInput): Quote {
  const baseByType: Record<RideType, number> = {
    point_to_point: 85,
    airport: 105,
    hourly: 140,
    event: 175
  };

  const baseFare = baseByType[input.rideType];
  const distanceFare = input.rideType === "hourly" ? 0 : input.distanceMiles * 3.25;
  const timeFare =
    input.rideType === "hourly"
      ? Math.max(2, input.hourlyHours ?? 2) * 140
      : input.durationMinutes * 0.9;

  const tolls = Math.max(0, input.tolls ?? 0);
  const subtotal = baseFare + distanceFare + timeFare + tolls;
  const serviceFee = subtotal * 0.08;
  const customerTotal = subtotal + serviceFee;

  // Internal planning estimate only. Final driver compensation is set by operations.
  const estimatedDriverPay = subtotal * 0.62;
  const estimatedB1Gross = customerTotal - estimatedDriverPay - tolls;

  return {
    baseFare: money(baseFare),
    distanceFare: money(distanceFare),
    timeFare: money(timeFare),
    tolls: money(tolls),
    serviceFee: money(serviceFee),
    subtotal: money(subtotal),
    customerTotal: money(customerTotal),
    estimatedDriverPay: money(estimatedDriverPay),
    estimatedB1Gross: money(estimatedB1Gross)
  };
}
