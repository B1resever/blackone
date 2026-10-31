// Payment return destinations belong to server configuration, never request data.
export function paymentReturnUrl(configuredUrl: string, requestCode: string): string {
  const url = new URL(configuredUrl);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('invalid_payment_return_url');
  }
  url.searchParams.set('request_code', requestCode);
  return url.toString();
}
