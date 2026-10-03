import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

const schema = z.object({
  expoPushToken: z.string().min(20).max(300),
  platform: z.enum(['ios','android','web','unknown']).default('unknown'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  await sql`
    insert into one_push_tokens (
      user_id,
      expo_push_token,
      platform,
      enabled,
      last_seen_at,
      updated_at
    ) values (
      ${user.id},
      ${parsed.data.expoPushToken},
      ${parsed.data.platform},
      true,
      now(),
      now()
    )
    on conflict (expo_push_token) do update set
      user_id = excluded.user_id,
      platform = excluded.platform,
      enabled = true,
      last_seen_at = now(),
      updated_at = now()
  `;

  return res.status(200).json({ registered: true });
}
