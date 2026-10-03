import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const schema = z.object({
  applicationCode: z.string().trim().min(8).max(64),
  status: z.enum(['submitted','reviewing','approved','rejected','documents_required']),
  reviewNotes: z.string().trim().max(2000).default(''),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    update one_driver_applications
    set status = ${parsed.data.status},
        review_notes = ${parsed.data.reviewNotes || null},
        updated_at = now()
    where application_code = ${parsed.data.applicationCode}
    returning
      application_code,
      market_id,
      full_name,
      email,
      phone,
      status,
      review_notes,
      updated_at
  `;

  const application = rows[0];
  if (!application) return res.status(404).json({ error: 'application_not_found' });

  let driverUserId: string | null = null;

  if (parsed.data.status === 'approved') {
    const existing = await sql`
      select id
      from one_users
      where role = 'driver'
        and lower(email) = lower(${application.email})
      limit 1
    `;

    if (existing[0]?.id) {
      driverUserId = String(existing[0].id);
      await sql`
        update one_users
        set full_name = ${application.full_name},
            phone = ${application.phone},
            status = 'active',
            updated_at = now()
        where id = ${driverUserId}
      `;
    } else {
      const inserted = await sql`
        insert into one_users (
          role,
          full_name,
          email,
          phone,
          status
        ) values (
          'driver',
          ${application.full_name},
          ${String(application.email).toLowerCase()},
          ${application.phone},
          'active'
        )
        returning id
      `;
      driverUserId = String(inserted[0].id);
    }

    const feeModel = application.market_id === 'buenos-aires' ? 'percentage' : 'monthly_cap';
    const monthlyCap = application.market_id === 'south-florida' ? 2500 : null;
    const tripPercent = application.market_id === 'buenos-aires' ? 0.10 : 0.05;

    await sql`
      insert into one_driver_profiles (
        user_id,
        onboarding_status,
        verification_status,
        home_market_id,
        driver_fee_model,
        monthly_cap_amount_minor,
        percent_per_trip,
        updated_at
      ) values (
        ${driverUserId},
        'approved',
        'approved',
        ${application.market_id},
        ${feeModel},
        ${monthlyCap},
        ${tripPercent},
        now()
      )
      on conflict (user_id) do update set
        onboarding_status = excluded.onboarding_status,
        verification_status = excluded.verification_status,
        home_market_id = excluded.home_market_id,
        driver_fee_model = excluded.driver_fee_model,
        monthly_cap_amount_minor = excluded.monthly_cap_amount_minor,
        percent_per_trip = excluded.percent_per_trip,
        updated_at = now()
    `;
  }

  return res.status(200).json({ application, driverUserId });
}
