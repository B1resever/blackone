import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  status: z.enum(['requested','quoted','confirmed','assigned','driver_en_route','arrived','passenger_onboard','completed','cancelled']).optional(),
  quoteAmountMinor: z.number().int().positive().optional(),
  quoteCurrency: z.enum(['USD','ARS']).optional(),
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
  const input = parsed.data;

  if (input.quoteAmountMinor && input.quoteCurrency) {
    await sql`
      update one_reservations
      set quote_amount_minor = ${input.quoteAmountMinor},
          quote_currency = ${input.quoteCurrency},
          quote_confirmed_at = now(),
          status = case when status = 'requested' then 'quoted' else status end,
          updated_at = now()
      where request_code = ${input.requestCode}
    `;
  }

  if (input.status) {
    await sql`
      update one_reservations
      set status = ${input.status},
          updated_at = now()
      where request_code = ${input.requestCode}
    `;

    await sql`
      insert into one_trip_events (reservation_id, event_type, payload)
      select id, 'status_changed', jsonb_build_object('status', ${input.status}, 'source', 'ONE Ops')
      from one_reservations
      where request_code = ${input.requestCode}
    `;
  }

  const rows = await sql`
    select request_code, status, payment_status, quote_amount_minor, quote_currency, updated_at
    from one_reservations
    where request_code = ${input.requestCode}
    limit 1
  `;

  if (!rows[0]) return res.status(404).json({ error: 'reservation_not_found' });
  return res.status(200).json({ reservation: rows[0] });
}
