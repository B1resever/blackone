import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createRequestCode } from '../src/ids.js';

const schema = z.object({
  marketId: z.enum(['south-florida', 'buenos-aires']),
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(40),
  licenseRegion: z.string().trim().min(2).max(120),
  vehicleYear: z.string().regex(/^20\d{2}$/),
  vehicleMake: z.string().trim().min(2).max(80),
  vehicleModel: z.string().trim().min(2).max(100),
  plateNumber: z.string().trim().max(40).default(''),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const input = parsed.data;
  const applicationCode = createRequestCode().replace('ONE-', 'DRV-');

  try {
    await sql`
      insert into one_driver_applications (
        application_code,
        market_id,
        full_name,
        email,
        phone,
        license_region,
        vehicle_year,
        vehicle_make,
        vehicle_model,
        plate_number,
        status
      ) values (
        ${applicationCode},
        ${input.marketId},
        ${input.fullName},
        ${input.email.toLowerCase()},
        ${input.phone},
        ${input.licenseRegion},
        ${Number(input.vehicleYear)},
        ${input.vehicleMake},
        ${input.vehicleModel},
        ${input.plateNumber || null},
        'submitted'
      )
    `;

    return res.status(201).json({
      applicationCode,
      status: 'submitted',
      message: 'Driver application received for BLACK ONE review.',
    });
  } catch (error) {
    console.error('ONE driver application insert failed', error);
    return res.status(500).json({ error: 'driver_application_failed' });
  }
}
