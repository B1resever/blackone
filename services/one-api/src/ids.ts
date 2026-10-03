import { randomBytes } from 'node:crypto';

export function createRequestCode() {
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return 'ONE-' + year + '-' + suffix;
}
