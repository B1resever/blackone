import { z } from 'zod';

export const marketIdSchema = z.enum(['south-florida', 'buenos-aires']);
export const rideTypeSchema = z.enum(['one-way', 'hourly', 'round-trip']);
export const vehicleClassSchema = z.enum(['confort', 'xl', 'suv-black', 'ultra-exclusive']);

export const reservationRequestSchema = z.object({
  marketId: marketIdSchema,
  rideType: rideTypeSchema,
  pickup: z.string().trim().min(3).max(500),
  dropoff: z.string().trim().max(500).default(''),
  pickupDate: z.string().trim().min(4).max(20),
  pickupTime: z.string().trim().min(2).max(20),
  passengers: z.number().int().min(1).max(20),
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(40),
  vehicleClass: vehicleClassSchema,
  notes: z.string().trim().max(2000).default(''),
}).superRefine((value, ctx) => {
  if (value.rideType !== 'hourly' && value.dropoff.length < 3) {
    ctx.addIssue({
      code: 'custom',
      path: ['dropoff'],
      message: 'Drop-off is required for this ride type',
    });
  }
});

export const quoteRequestSchema = z.object({
  marketId: marketIdSchema,
  rideType: rideTypeSchema,
  vehicleClass: vehicleClassSchema,
  pickup: z.string().trim().min(3).max(500),
  dropoff: z.string().trim().max(500).default(''),
  pickupDate: z.string().trim().min(4).max(20),
  pickupTime: z.string().trim().min(2).max(20),
  passengers: z.number().int().min(1).max(20),
});
