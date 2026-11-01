// B1 customer terms, independent of driver remuneration.
export const hourlyServiceTerms = Object.freeze({
  version: 'south-florida-hourly-2026-11-01', currency: 'USD',
  hourlyMinor: 20000, minimumHours: 3, minimumMinor: 60000,
  overtimeGraceMinutes: 15, tipsIncluded: false, extrasIncluded: false,
  overtimeBasis: 'started_minutes_after_grace',
});

export function hourlyBaseMinor(hours: number) {
  if (!Number.isInteger(hours) || hours < 3 || hours > 24) throw new Error('Hourly service requires 3–24 hours.');
  return hours * hourlyServiceTerms.hourlyMinor;
}

export function hourlyOvertimeMinor(secondsBeyondBookedEnd: number) {
  if (!Number.isSafeInteger(secondsBeyondBookedEnd) || secondsBeyondBookedEnd < 0) throw new Error('Invalid overtime duration.');
  const minutes = Math.ceil(Math.max(0, secondsBeyondBookedEnd - 15 * 60) / 60);
  // Keep 20000/60 exact until the TOTAL is rounded. Do not multiply $3.33.
  return Math.round(minutes * hourlyServiceTerms.hourlyMinor / 60);
}
