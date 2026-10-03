import { neon } from '@neondatabase/serverless';

export async function sendPushToUser(
  userId: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, string | number | boolean | null> = {},
) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !userId) return { sent: 0 };

  const sql = neon(databaseUrl);
  const rows = await sql`
    select expo_push_token
    from one_push_tokens
    where user_id = ${userId}
      and enabled = true
    order by last_seen_at desc
    limit 8
  `;

  const tokens = rows
    .map((row) => String(row.expo_push_token ?? ''))
    .filter((token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));

  if (!tokens.length) return { sent: 0 };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title,
          body,
          sound: 'default',
          data,
        })),
      ),
    });

    if (!response.ok) {
      console.error('ONE push send failed', response.status, await response.text());
      return { sent: 0 };
    }

    return { sent: tokens.length };
  } catch (error) {
    console.error('ONE push transport failed', error);
    return { sent: 0 };
  }
}
