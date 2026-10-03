import type { VercelRequest } from '@vercel/node';

export function isAdminAuthorized(req: VercelRequest) {
  const expected = process.env.ONE_ADMIN_API_TOKEN?.trim();
  if (!expected) return false;
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  return header === 'Bearer ' + expected;
}
