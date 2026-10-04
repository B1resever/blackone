import type { VercelRequest } from '@vercel/node';
import { getSessionUser } from './auth.js';

function legacyTokenAuthorized(req: VercelRequest) {
  const expected = process.env.ONE_ADMIN_API_TOKEN?.trim();
  if (!expected) return false;
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  return header === 'Bearer ' + expected;
}

export async function isAdminAuthorized(req: VercelRequest) {
  if (legacyTokenAuthorized(req)) return true;

  const user = await getSessionUser(req);
  return Boolean(user && ['admin', 'dispatcher'].includes(user.role));
}
