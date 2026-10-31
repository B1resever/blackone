const zones: Record<string, string> = { 'south-florida': 'America/New_York', 'buenos-aires': 'America/Argentina/Buenos_Aires' };

// Resolve a market-local appointment, independently of the server/device timezone.
export function scheduledRideInstant(date: string, time: string, marketId: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !zones[marketId]) return null;
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;
  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(time.trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const target = day.getTime() + (hour * 60 + minute) * 60000;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: zones[marketId], year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(candidate).map(part => [part.type, part.value]));
    const displayed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const correction = target - displayed;
    if (correction === 0) return candidate;
    candidate += correction;
  }
  return null; // A nonexistent local time during a daylight-saving transition.
}
