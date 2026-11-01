import { z } from 'zod';

export const driverApplicationSchema = z.object({
  marketId: z.enum(['south-florida', 'buenos-aires']),
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(40),
  licenseRegion: z.string().trim().min(2).max(120),
  vehicleYear: z.string().regex(/^20\d{2}$/),
  vehicleMake: z.string().trim().min(2).max(80),
  vehicleModel: z.string().trim().min(2).max(100),
  plateNumber: z.string().trim().max(40).default(''),
  vehicleClassId: z.enum(['xl', 'suv-black']),
  vehicleColor: z.string().trim().max(40).default(''),
  passengerCapacity: z.number().int().min(1).max(7).optional(),
  payoutMethod: z.enum(['bank_transfer', 'zelle', 'coordinate_with_b1']).default('coordinate_with_b1'),
  whatsappConsent: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.vehicleClassId === 'suv-black' && (value.passengerCapacity ?? 0) > 6) ctx.addIssue({ code: 'custom', path: ['passengerCapacity'], message: 'SUV Black supports up to six passengers.' });
  if (value.payoutMethod === 'zelle' && value.marketId !== 'south-florida') ctx.addIssue({ code: 'custom', path: ['payoutMethod'], message: 'Zelle preference is available for USA applications only.' });
});

export function driverIntakeDetails(value: z.infer<typeof driverApplicationSchema>) {
  return {
    vehicleColor: value.vehicleColor,
    passengerCapacity: value.passengerCapacity ?? null,
    payoutMethod: value.payoutMethod,
    payoutSetupStatus: 'pending', // A preference is not a configured or verified payout destination.
    whatsappConsent: value.whatsappConsent,
    whatsappConsentRecordedAt: value.whatsappConsent ? new Date().toISOString() : null,
  };
}
