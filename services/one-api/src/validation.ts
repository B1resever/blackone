import { z } from 'zod';
import { pickupDetailsShape } from './pickup-details.js';
import { scheduledRideInstant } from './scheduled-rides.js';

export const marketIdSchema = z.enum(['south-florida', 'buenos-aires']);
export const rideTypeSchema = z.enum(['one-way', 'hourly', 'round-trip']);
export const vehicleClassSchema = z.enum(['confort', 'xl', 'suv-black', 'ultra-exclusive']);

const tripShape = {
  marketId: marketIdSchema,
  rideType: rideTypeSchema,
  pickup: z.string().trim().min(3).max(500),
  dropoff: z.string().trim().max(500).default(''),
  pickupDate: z.string().trim().min(4).max(20),
  pickupTime: z.string().trim().min(2).max(20),
  returnDate: z.string().trim().max(20).default(''),
  returnTime: z.string().trim().max(20).default(''),
  hourlyHours: z.number().int().min(1).max(24).default(2),
  passengers: z.number().int().min(1).max(20),
  vehicleClass: vehicleClassSchema,
};

function validateTrip(
  value: {
    marketId: string;
    pickupDate: string;
    pickupTime: string;
    rideType: 'one-way' | 'hourly' | 'round-trip';
    dropoff: string;
    returnDate: string;
    returnTime: string;
    hourlyHours: number;
  },
  ctx: z.RefinementCtx,
) {
  const pickup = scheduledRideInstant(value.pickupDate, value.pickupTime, value.marketId);
  if (pickup === null || pickup <= Date.now()) {
    ctx.addIssue({ code: 'custom', path: ['pickupDate'], message: 'B1 accepts scheduled rides only. Choose a valid future date and time in the service market.' });
  }
  if (value.rideType === 'round-trip' && value.returnDate && value.returnTime) {
    const back = scheduledRideInstant(value.returnDate, value.returnTime, value.marketId);
    if (back === null || pickup === null || back <= pickup) ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return must be scheduled after pickup.' });
  }
  if (value.rideType !== 'hourly' && value.dropoff.length < 3) {
    ctx.addIssue({
      code: 'custom',
      path: ['dropoff'],
      message: 'Drop-off is required for this ride type',
    });
  }

  if (value.rideType === 'round-trip' && (!value.returnDate || !value.returnTime)) {
    ctx.addIssue({
      code: 'custom',
      path: ['returnDate'],
      message: 'Return date and time are required for round trips',
    });
  }

  if (value.rideType === 'hourly' && value.hourlyHours < 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['hourlyHours'],
      message: 'Hourly service requires at least one hour',
    });
  }
}

export const reservationRequestSchema = z.object({
  ...tripShape,
  ...pickupDetailsShape,
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(40),
  notes: z.string().trim().max(2000).default(''),
}).superRefine(validateTrip);

export const quoteRequestSchema = z.object({ ...tripShape, ...pickupDetailsShape }).superRefine(validateTrip);
