import { randomBytes } from 'node:crypto';

export function createRequestCode() {
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return 'ONE-' + year + '-' + suffix;
}


export function createRideCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let code = '';
  for (const value of bytes) {
    code += alphabet[value % alphabet.length];
  }
  return code;
}
