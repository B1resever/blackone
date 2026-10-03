import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { VercelRequest } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  role: 'passenger' | 'driver' | 'admin' | 'dispatcher';
  fullName: string;
  email: string | null;
  phone: string | null;
  locale: string;
};

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return 'scrypt$' + salt + '$' + derived.toString('hex');
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded) return false;
  const [algorithm, salt, expectedHex] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession(userId: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const sql = neon(databaseUrl);
  await sql`
    insert into one_auth_sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
  `;

  return { token, expiresAt: expiresAt.toISOString() };
}

export function readBearerToken(req: VercelRequest) {
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length >= 20 ? token : null;
}

export async function getSessionUser(req: VercelRequest): Promise<SessionUser | null> {
  const token = readBearerToken(req);
  const databaseUrl = process.env.DATABASE_URL;
  if (!token || !databaseUrl) return null;

  const sql = neon(databaseUrl);
  const tokenHash = hashSessionToken(token);

  const rows = await sql`
    select
      u.id,
      u.role,
      u.full_name,
      u.email,
      u.phone,
      u.locale
    from one_auth_sessions s
    join one_users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
      and u.status = 'active'
      and u.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  await sql`
    update one_auth_sessions
    set last_used_at = now()
    where token_hash = ${tokenHash}
  `;

  return {
    id: String(row.id),
    role: row.role as SessionUser['role'],
    fullName: String(row.full_name),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    locale: String(row.locale ?? 'en'),
  };
}

export async function revokeCurrentSession(req: VercelRequest) {
  const token = readBearerToken(req);
  const databaseUrl = process.env.DATABASE_URL;
  if (!token || !databaseUrl) return;
  const sql = neon(databaseUrl);
  await sql`
    delete from one_auth_sessions
    where token_hash = ${hashSessionToken(token)}
  `;
}
