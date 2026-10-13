import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return res.status(503).json({ error: 'database_not_configured' });
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      id,
      country_code as "countryCode",
      name,
      currency,
      time_zone as "timeZone",
      active
    from one_markets
    where active = true
    order by case id
      when 'south-florida' then 1
      when 'buenos-aires' then 2
      else 100
    end, name
  `;

  return res.status(200).json({ markets: rows });
}
