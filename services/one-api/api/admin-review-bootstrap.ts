import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { hashPassword } from '../src/auth.js';

function authorized(req: VercelRequest) {
  const expected = process.env.ONE_ADMIN_API_TOKEN?.trim();
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  return Boolean(expected && header === 'Bearer ' + expected);
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('missing_' + name.toLowerCase());
  return value;
}

async function upsertUser(
  sql: ReturnType<typeof neon>,
  input: { role: 'passenger' | 'driver'; fullName: string; email: string; password: string },
) {
  const hash = await hashPassword(input.password);
  const existing = await sql`
    select id
    from one_users
    where lower(email) = lower(${input.email})
    limit 1
  `;

  if (existing[0]?.id) {
    const rows = await sql`
      update one_users
      set role = ${input.role},
          full_name = ${input.fullName},
          password_hash = ${hash},
          status = 'active',
          deleted_at = null,
          updated_at = now()
      where id = ${existing[0].id}
      returning id, email
    `;
    return rows[0];
  }

  const rows = await sql`
    insert into one_users (role, full_name, email, phone, locale, status, password_hash)
    values (${input.role}, ${input.fullName}, ${input.email}, '+13055550100', 'en', 'active', ${hash})
    returning id, email
  `;
  return rows[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  if (process.env.ONE_REVIEW_BOOTSTRAP_ENABLED !== 'true') {
    return res.status(403).json({ error: 'review_bootstrap_disabled' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  try {
    const passengerEmail = requiredEnv('ONE_REVIEW_PASSENGER_EMAIL').toLowerCase();
    const passengerPassword = requiredEnv('ONE_REVIEW_PASSENGER_PASSWORD');
    const driverEmail = requiredEnv('ONE_REVIEW_DRIVER_EMAIL').toLowerCase();
    const driverPassword = requiredEnv('ONE_REVIEW_DRIVER_PASSWORD');

    if (passengerPassword.length < 12 || driverPassword.length < 12) {
      return res.status(400).json({ error: 'review_password_too_short' });
    }

    const passenger = await upsertUser(sql, {
      role: 'passenger',
      fullName: 'ONE App Review Passenger',
      email: passengerEmail,
      password: passengerPassword,
    });

    const driver = await upsertUser(sql, {
      role: 'driver',
      fullName: 'ONE App Review Driver',
      email: driverEmail,
      password: driverPassword,
    });

    await sql`
      insert into one_driver_profiles (
        user_id,
        onboarding_status,
        verification_status,
        home_market_id,
        driver_fee_model,
        monthly_cap_amount_minor,
        percent_per_trip,
        available_for_assignment,
        compliance_status,
        compliance_checked_at
      ) values (
        ${driver.id},
        'approved',
        'approved',
        'south-florida',
        'monthly_cap',
        2500,
        0.05,
        false,
        'approved',
        now()
      )
      on conflict (user_id) do update set
        onboarding_status = 'approved',
        verification_status = 'approved',
        home_market_id = 'south-florida',
        driver_fee_model = 'monthly_cap',
        monthly_cap_amount_minor = 2500,
        percent_per_trip = 0.05,
        available_for_assignment = false,
        compliance_status = 'approved',
        compliance_checked_at = now(),
        updated_at = now()
    `;

    for (const documentType of ['driver_license','insurance','vehicle_registration','background_check'] as const) {
      const current = await sql`
        select id
        from one_driver_documents
        where driver_user_id = ${driver.id}
          and document_type = ${documentType}
          and status = 'approved'
        limit 1
      `;
      if (!current[0]) {
        await sql`
          insert into one_driver_documents (
            driver_user_id,
            document_type,
            document_number,
            status,
            review_notes,
            verified_at
          ) values (
            ${driver.id},
            ${documentType},
            'APP-REVIEW',
            'approved',
            'Dedicated App Store / Play review fixture. Not a production driver credential.',
            now()
          )
        `;
      }
    }

    const existingVehicle = await sql`
      select id
      from one_driver_vehicles
      where driver_user_id = ${driver.id}
        and plate_number = 'APPREVIEW'
      limit 1
    `;

    let vehicleId = existingVehicle[0]?.id;
    if (!vehicleId) {
      const vehicleRows = await sql`
        insert into one_driver_vehicles (
          driver_user_id,
          vehicle_class_id,
          make,
          model,
          vehicle_year,
          color,
          plate_country,
          plate_region,
          plate_number,
          status
        ) values (
          ${driver.id},
          'suv-black',
          'Cadillac',
          'Escalade ESV',
          2026,
          'Black',
          'US',
          'FL',
          'APPREVIEW',
          'approved'
        )
        returning id
      `;
      vehicleId = vehicleRows[0].id;
    }

    const reservationRows = await sql`
      insert into one_reservations (
        request_code,
        passenger_user_id,
        market_id,
        ride_type,
        pickup_text,
        dropoff_text,
        pickup_date_text,
        pickup_time_text,
        passenger_count,
        vehicle_class_id,
        guest_full_name,
        guest_email,
        guest_phone,
        status,
        quote_amount_minor,
        quote_currency,
        quote_confirmed_at,
        payment_status,
        assigned_driver_user_id,
        assigned_vehicle_id,
        ride_code
      ) values (
        'ONE-APP-REVIEW',
        ${passenger.id},
        'south-florida',
        'one-way',
        'Miami International Airport (MIA)',
        'Brickell, Miami, FL',
        '2099-01-01',
        '2:30 PM',
        1,
        'suv-black',
        'ONE App Review Passenger',
        ${passengerEmail},
        '+13055550100',
        'assigned',
        12500,
        'USD',
        now(),
        'paid',
        ${driver.id},
        ${vehicleId},
        'ONE246'
      )
      on conflict (request_code) do update set
        passenger_user_id = excluded.passenger_user_id,
        guest_email = excluded.guest_email,
        status = 'assigned',
        payment_status = 'paid',
        assigned_driver_user_id = excluded.assigned_driver_user_id,
        assigned_vehicle_id = excluded.assigned_vehicle_id,
        ride_code = excluded.ride_code,
        ride_code_verified_at = null,
        updated_at = now()
      returning request_code
    `;

    return res.status(200).json({
      ready: true,
      passengerEmail,
      driverEmail,
      reviewReservation: reservationRows[0]?.request_code ?? 'ONE-APP-REVIEW',
      note: 'Passwords remain in environment variables and are never returned by this endpoint.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'review_bootstrap_failed';
    return res.status(500).json({ error: message });
  }
}
