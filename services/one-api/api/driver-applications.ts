import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { driverApplicationSchema, driverIntakeDetails } from '../src/driver-intake.js';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createRequestCode } from '../src/ids.js';



export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = driverApplicationSchema.safeParse(req.body);
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
        vehicle_class_id,
        intake_details,
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
        ${input.vehicleClassId},
        ${JSON.stringify(driverIntakeDetails(input))}::jsonb,
        'submitted'
      )
    `;

    return res.status(201).json({
      applicationCode,
      status: 'submitted',
      message: 'Driver application received for BLACK ONE review.',
    });
  } catch (error) {
    console.error('ONE driver application insert failed');
    return res.status(500).json({ error: 'driver_application_failed' });
  }
}
