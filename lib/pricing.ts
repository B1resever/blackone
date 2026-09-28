export type RideType = "point_to_point" | "airport";
export type VehicleClass = "comfort" | "xl" | "suv";

export type QuoteInput = {
  rideType: RideType;
  vehicleClass: VehicleClass;
  distanceMiles: number;
  durationMinutes: number;
  tolls?: number;
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

// Working B1 Ride rates. These remain configurable while the market model is finalized.
const rateCard: Record<VehicleClass,{minimum:number;perMile:number;perMinute:number}> = {
  comfort: { minimum:45, perMile:5.75, perMinute:0.55 },
  xl:      { minimum:50, perMile:5.25, perMinute:0.55 },
  suv:     { minimum:85, perMile:10.00, perMinute:0.80 }
};

export function calculateQuote(input: QuoteInput): Quote {
  const rate=rateCard[input.vehicleClass];
  const airportSupplement=input.rideType==="airport" ? 20 : 0;
  const distanceFare=input.distanceMiles*rate.perMile;
  const timeFare=input.durationMinutes*rate.perMinute;
  const transportation=Math.max(rate.minimum,distanceFare+timeFare)+airportSupplement;
  const tolls=Math.max(0,input.tolls ?? 0);
  const serviceFee=transportation*0.08;
  const subtotal=transportation+tolls;
  const customerTotal=subtotal+serviceFee;

  // Internal planning estimate only. Final provider compensation is controlled by B1 operations.
  const estimatedDriverPay=transportation*0.62;
  const estimatedB1Gross=customerTotal-estimatedDriverPay-tolls;

  return {
    baseFare:money(Math.max(0,transportation-distanceFare-timeFare)),
    distanceFare:money(distanceFare),
    timeFare:money(timeFare),
    tolls:money(tolls),
    serviceFee:money(serviceFee),
    subtotal:money(subtotal),
    customerTotal:money(customerTotal),
    estimatedDriverPay:money(estimatedDriverPay),
    estimatedB1Gross:money(estimatedB1Gross)
  };
}
